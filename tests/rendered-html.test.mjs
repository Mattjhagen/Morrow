import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Velour storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Velour — Make a living from what you love making<\/title>/,
  );
  assert.match(html, /Your store\. <em>Ready before<\/em> lunch\./);
  assert.match(html, /Make my store/);
  assert.match(html, /Start my free 14 days/);
  assert.match(
    html,
    /Velour is the calmest way to launch and run your store\./,
  );
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("keeps the passwordless sign-in flow wired to public Supabase configuration", async () => {
  const [page, layout, envExample] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(
    layout,
    /title:\s*"Velour — Make a living from what you love making"/,
  );
  assert.match(envExample, /^NEXT_PUBLIC_SUPABASE_URL=/m);
  assert.match(envExample, /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/m);
  assert.match(page, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(page, /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(page, /\/auth\/v1\/otp/);
  assert.match(page, /method:\s*"POST"/);
  assert.match(page, /create_user:\s*true/);
  assert.match(page, /email_redirect_to:\s*window\.location\.origin/);
  assert.match(page, /\/auth\/v1\/user/);
  assert.match(page, /window\.history\.replaceState/);
  assert.match(page, /\/rest\/v1\/stores/);
  assert.doesNotMatch(page, /service_role|SUPABASE_SERVICE_ROLE/i);
});
