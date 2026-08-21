import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const SYSTEM_PROMPT = `You are Velour Assistant, the refined AI concierge for Velour (velour.live).
You are calm, elegant, knowledgeable, and helpful.

About Velour:
- Velour is the calm, editorial e-commerce platform crafted for independent makers, artists, and boutique design studios.
- Key features: Zero-bloat fast storefronts, customizable themes (Warm Paper, Midnight Luxury, Modern Olive), visual product catalog with sale prices & variants, automated order receipts with carbon-neutral shipping tracking, discount codes, customer orders modal, and Stripe payments.
- Quick start: Explore the live Juniper Studio showcase or launch a fresh private store in seconds.
- Platform: Built with high-speed edge architecture, elegant typography, and responsive commerce design.

CRITICAL INSTRUCTIONS:
- You are in live chat mode. Respond directly to the user with your final message only.
- NEVER output your thinking process, scratchpad, reasoning steps, analysis, or constraints check.
- Keep responses concise (2 to 3 sentences), warm, and articulate.
`;

const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "z-ai/glm-5.2:free",
  "nvidia/nemotron-3.5-lightning:free",
];

function cleanAiResponse(text: string, defaultFallback: string): string {
  if (!text) return defaultFallback;

  let cleaned = text.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, "").trim();

  if (
    /^Here'?s a thinking process/i.test(cleaned) ||
    /^\*\*Thinking Process/i.test(cleaned) ||
    /^1\.\s+\*\*Analyze/i.test(cleaned) ||
    cleaned.toLowerCase().includes("thinking process:") ||
    cleaned.includes("Check against constraints")
  ) {
    const parts = cleaned.split(/["“”]/);
    const validQuotes: string[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      const q = parts[i].trim();
      if (q.length > 20 && !q.startsWith("Analyze") && !q.startsWith("Keep responses")) {
        validQuotes.push(q);
      }
    }
    if (validQuotes.length > 0) {
      return validQuotes[validQuotes.length - 1];
    }
    return defaultFallback;
  }

  cleaned = cleaned.replace(/^(?:Assistant|Response|Velour|Answer):\s*/i, "").trim();
  return cleaned || defaultFallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let rawMessages = body.messages || [];

    if (body.message && typeof body.message === "string") {
      rawMessages = [{ role: "user", content: body.message }];
    }

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "messages array or message string required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...rawMessages.map((m: { role?: string; content?: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 2000),
      })),
    ];

    const apiKey = (process.env.OPENROUTER_API_KEY || "")
      .trim()
      .replace(/^["'`]|["'`]$/g, "")
      .trim();
    const preferredModel = process.env.OPENROUTER_MODEL || FREE_MODELS[0];
    const modelQueue = [
      preferredModel,
      ...FREE_MODELS.filter((m) => m !== preferredModel),
    ];

    const defaultGreeting =
      "Welcome to Velour. ✦ We make launching an artisanal e-commerce storefront effortless and beautiful. Explore our Juniper Studio showcase or start your own store today!";

    if (!apiKey) {
      return NextResponse.json(
        {
          response: defaultGreeting,
          model: "simulated-concierge",
        },
        { headers: CORS_HEADERS }
      );
    }

    let lastError: string | null = null;

    for (const model of modelQueue) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://velour.live",
            "X-Title": "Velour Concierge",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 600,
            include_reasoning: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawReply = data.choices?.[0]?.message?.content?.trim();
          if (rawReply) {
            const cleanedReply = cleanAiResponse(rawReply, defaultGreeting);
            return NextResponse.json(
              { response: cleanedReply, model },
              { headers: CORS_HEADERS }
            );
          }
        } else {
          const errText = await res.text();
          lastError = `Model ${model} error (${res.status}): ${errText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json(
      {
        response: defaultGreeting,
        model: "concierge-fallback",
        warning: lastError,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      {
        response:
          "Velour Concierge is temporarily refreshing. Please explore the dashboard or try again in a moment.",
        error: err instanceof Error ? err.message : "Internal error",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
