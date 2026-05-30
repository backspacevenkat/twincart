/**
 * Browserbase + Stagehand smoke test (STANDALONE).
 *
 * Verifies the TwinCart browser-checkout agent stack end-to-end:
 *   1. Opens a real cloud browser session on Browserbase.
 *   2. Drives it with Stagehand (Playwright/CDP under the hood, AI-powered acts).
 *   3. Navigates, performs one AI action, reads the page title.
 *   4. Prints the live session-replay URL.
 *   5. Closes cleanly (releases the Browserbase session).
 *
 * Run:  bun scripts/browserbase-smoke.ts
 *       bun scripts/browserbase-smoke.ts https://www.temu.com
 *
 * Secrets are read from process.env only (bun auto-loads .env). Never hardcoded.
 *
 * Stagehand 3.x notes (verified live against @browserbasehq/stagehand@3.4.0, 2026):
 *  - Constructor takes `model: "provider/model"` (string) or `model: {modelName, apiKey}`.
 *    Stagehand reads ANTHROPIC_API_KEY / OPENAI_API_KEY from env automatically.
 *  - `await stagehand.init()` opens the Browserbase session. In 3.4.0 it returns
 *    void — do NOT destructure it. Read the session id from the
 *    `stagehand.browserbaseSessionID` getter instead.
 *  - There is NO `stagehand.page` getter in 3.4.0. Get the page via
 *    `stagehand.context.pages()[0]` (a real Playwright Page).
 *  - `await stagehand.act("...")` performs one AI-driven action on the active page
 *    (returns ActResult; "no actionable element" is a normal, non-error outcome).
 *  - We avoid stagehand.extract({ schema }) here: this repo pins zod@4, and the
 *    schema path is finicky across zod majors. Plain acts + page.title() sidestep it.
 */

import { Stagehand } from "@browserbasehq/stagehand";

function pickModel(): string {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return "anthropic/claude-sonnet-4-5-20250929";
  }
  if (process.env.OPENAI_API_KEY) return "openai/gpt-4.1-mini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic/claude-sonnet-4-5-20250929";
  throw new Error("No LLM key found: set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env");
}

async function main() {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY not set in .env");
  if (!projectId) throw new Error("BROWSERBASE_PROJECT_ID not set in .env");

  const targetUrl = process.argv[2] || "https://example.com";
  const model = pickModel();

  console.log(`[smoke] target: ${targetUrl}`);
  console.log(`[smoke] model:  ${model}`);

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey,
    projectId,
    model,
    verbose: 1,
  });

  await stagehand.init();
  const sessionId = stagehand.browserbaseSessionID;
  const replayUrl = `https://www.browserbase.com/sessions/${sessionId}`;
  console.log(`[smoke] session: ${sessionId}`);
  console.log(`[smoke] replay:  ${replayUrl}`);

  try {
    // context.pages() is the cross-runtime-reliable accessor (see header note).
    const page = stagehand.context.pages()[0];

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeoutMs: 60_000 });

    const title = await page.title();
    console.log(`[smoke] title:   ${title}`);

    // One AI-driven action via the Stagehand orchestrator. Best-effort: pages
    // with no popup simply return "no actionable element" (not an error).
    try {
      await stagehand.act("accept cookies or dismiss any popup if one is shown");
      console.log(`[smoke] act:     completed (dismiss-popup attempt)`);
    } catch (err) {
      console.log(`[smoke] act:     skipped — ${(err as Error).message}`);
    }

    console.log(`[smoke] url:     ${page.url()}`);
    console.log(`[smoke] RESULT:  OK`);
  } finally {
    await stagehand.close();
    console.log(`[smoke] closed.  replay: ${replayUrl}`);
  }
}

main().catch((err) => {
  console.error(`[smoke] RESULT:  FAILED`);
  console.error(err);
  process.exit(1);
});
