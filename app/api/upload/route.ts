import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl, filename = "upload.jpg" } = body;
      if (!dataUrl) {
        return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
      });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64,
        filename: file.name,
        size: file.size,
      });
    }

    return NextResponse.json({ error: "Unsupported media content type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
