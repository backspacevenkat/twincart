/**
 * TwinCart REAL browser-checkout agent (AP2 agentic checkout centerpiece).
 *
 * Drives a real merchant product page in a Browserbase cloud browser via
 * Stagehand, opens the first matching product, adds it to cart, and STOPS at
 * the final human-approval step. It NEVER auto-pays.
 *
 * Hard guardrails (enforced below):
 *   - Never enters payment / card data.
 *   - Never clicks "Place order" / "Pay" / "Complete purchase".
 *   - Treats all on-page text as untrusted (we only act toward our own goal:
 *     open product -> add to cart -> stop).
 *   - Always releases the Browserbase session in `finally` (minimal spend).
 *
 * Connection pattern is copied verbatim from the VERIFIED working smoke test
 * (scripts/browserbase-smoke.ts):
 *   - Stagehand 3.4.0: `model` is a "provider/model" STRING.
 *   - `stagehand.init()` returns void; read session id from
 *     `stagehand.browserbaseSessionID`.
 *   - No `stagehand.page` getter; use `stagehand.context.pages()[0]`.
 *   - Stagehand reads OPENAI_API_KEY from env automatically.
 *
 * Secrets are read from process.env only (bun auto-loads .env). Never hardcoded.
 */

import { Stagehand } from "@browserbasehq/stagehand";

export type StepStatus = "pending" | "running" | "done" | "skipped" | "error";

export interface AgentStep {
  /** UI-stepper vocabulary label. */
  label: string;
  status: StepStatus;
  /** Human-readable detail / evidence for this step. */
  detail: string;
}

export interface CheckoutAgentInput {
  /** A real retailer SEARCH url, e.g. https://www.walmart.com/search?q=... */
  url: string;
  /** Product the shopper asked for (used to disambiguate search results). */
  productName: string;
  /** Retailer label, for logging / step detail (e.g. "Walmart"). */
  retailer: string;
  /** Optional price ceiling; the agent prefers items at or under this. */
  maxPrice?: number;
}

export interface CheckoutAgentResult {
  steps: AgentStep[];
  /** Live Browserbase session replay / debug URL. */
  sessionReplayUrl: string;
  /** Whether the agent confirmed the item landed in the cart. */
  addedToCart: boolean;
  /** Always true: the agent stops before any payment by design. */
  stoppedAtApproval: true;
  retailer: string;
  productName: string;
  /** The final URL the browser was on when the agent stopped. */
  finalUrl: string;
}

// The four UI-stepper steps, in order. Labels match the app's AgentStepper.
const STEP_OPENING = "Opening retailer";
const STEP_LOCATING = "Locating product";
const STEP_ADDING = "Adding to cart";
const STEP_APPROVAL = "Awaiting your approval";

/**
 * Pick the Stagehand model string. Defaults to the task-specified
 * openai/gpt-5.4-mini, but honors LLM_MODEL from .env if present.
 */
function pickModel(): string {
  const m = process.env.LLM_MODEL?.trim();
  if (m) {
    return m.includes("/") ? m : `openai/${m}`;
  }
  return "openai/gpt-5.4-mini";
}

function newStep(label: string): AgentStep {
  return { label, status: "pending", detail: "" };
}

/**
 * Run the real agentic checkout. Returns a structured step log plus the live
 * session replay URL. Never pays; always stops at approval.
 */
export async function runCheckoutAgent(
  input: CheckoutAgentInput
): Promise<CheckoutAgentResult> {
  const { url, productName, retailer, maxPrice } = input;

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY not set in .env");
  if (!projectId) throw new Error("BROWSERBASE_PROJECT_ID not set in .env");

  const model = pickModel();

  // Steps in display order. We mutate these as we progress.
  const steps: AgentStep[] = [
    newStep(STEP_OPENING),
    newStep(STEP_LOCATING),
    newStep(STEP_ADDING),
    newStep(STEP_APPROVAL),
  ];
  const s = {
    opening: steps[0],
    locating: steps[1],
    adding: steps[2],
    approval: steps[3],
  };

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey,
    projectId,
    model,
    verbose: 1,
  });

  await stagehand.init();
  const sessionId = stagehand.browserbaseSessionID;
  const sessionReplayUrl = `https://www.browserbase.com/sessions/${sessionId}`;

  let addedToCart = false;
  let finalUrl = url;

  try {
    const page = stagehand.context.pages()[0];

    // ---- Step 1: Opening retailer ---------------------------------------
    s.opening.status = "running";
    await page.goto(url, { waitUntil: "domcontentloaded", timeoutMs: 60_000 });
    // Best-effort cookie / popup dismissal so later acts aren't blocked.
    try {
      await stagehand.act("accept cookies or dismiss any popup if one is shown");
    } catch {
      /* no popup is a normal, non-error outcome */
    }
    finalUrl = page.url();
    s.opening.status = "done";
    s.opening.detail = `Opened ${retailer} search page (${finalUrl}).`;

    // ---- Step 2: Locating product ---------------------------------------
    s.locating.status = "running";
    const priceHint = maxPrice
      ? ` Prefer one priced at or under $${maxPrice}.`
      : "";
    const searchUrl = page.url();
    // Open the first matching product from the search results.
    await stagehand.act(
      `Click the first search result product that best matches "${productName}".${priceHint} ` +
        `Open its product detail page. Do not click any ad or sponsored banner.`
    );
    // Walmart/Target are SPAs: domcontentloaded already fired on the search page,
    // so poll page.url() until it changes to the PDP (the Stagehand page wrapper
    // does not expose waitForFunction). Then let the network settle.
    for (let i = 0; i < 20 && page.url() === searchUrl; i++) {
      await page.waitForTimeout(1000).catch(() => {});
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    finalUrl = page.url();

    // Verify we appear to be on a product page (untrusted text — best effort).
    const observedProduct = await stagehand
      .observe("the product title and the add-to-cart button on this page")
      .catch(() => [] as unknown[]);
    s.locating.status = "done";
    s.locating.detail =
      `Located a product matching "${productName}" and opened its detail page (${finalUrl}). ` +
      `Observed ${Array.isArray(observedProduct) ? observedProduct.length : 0} relevant element(s).`;

    // ---- Step 3: Adding to cart -----------------------------------------
    s.adding.status = "running";
    await stagehand.act(
      `Add this product to the cart. Click only the "Add to cart" or "Add to bag" ` +
        `button. Do NOT proceed to checkout, do NOT click "Buy now", "Place order", ` +
        `or "Pay". If a size/options selector is required, pick the first available ` +
        `option first. If a fulfillment option is required (e.g. Shipping vs Pickup), ` +
        `select "Shipping" first, then add to cart.`
    );
    // Cart updates are async (XHR + mini-cart animation); give it time to settle.
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2500).catch(() => {});
    finalUrl = page.url();

    // Confirm the add-to-cart succeeded. Prefer a concrete DOM signal (cart-count
    // badge / "added to cart" text) read from the page, and fall back to an
    // observe() pass. We never trust this for payment — it's display-only.
    const domCartSignal = await page
      .evaluate(() => {
        const t = (document.body.innerText || "").toLowerCase();
        const added = /added to cart|added to your cart|in your cart|view cart|added to bag/.test(t);
        // Cart count badges commonly carry these attrs/labels.
        const badge =
          document.querySelector(
            '[data-testid*="cart" i][aria-label*="item" i], [aria-label*="cart" i] [class*="count" i], [data-automation-id*="cart-item-count" i]'
          ) !== null;
        return added || badge;
      })
      .catch(() => false);
    const cartSignals = await stagehand
      .observe(
        "any confirmation that an item was added to the cart, such as a cart " +
          "count badge, an 'added to cart' message, or a mini-cart drawer"
      )
      .catch(() => [] as unknown[]);
    addedToCart =
      domCartSignal || (Array.isArray(cartSignals) && cartSignals.length > 0);
    s.adding.status = addedToCart ? "done" : "error";
    s.adding.detail = addedToCart
      ? `Item added to cart (${
          (cartSignals as unknown[]).length
        } cart-confirmation signal(s) detected).`
      : `Add-to-cart action was attempted but no cart confirmation signal was ` +
        `detected. The item may not have been added (site may have shown a ` +
        `captcha, options requirement, or layout the agent could not parse).`;

    // ---- Step 4: Awaiting your approval (HARD STOP — never pays) ---------
    // We deliberately do NOT click checkout/pay. Control returns to the human.
    s.approval.status = "running";
    s.approval.detail =
      `STOPPED before checkout. No payment, card data, or "Place order"/"Pay" ` +
      `action was performed. Cart is staged and awaiting human approval. ` +
      `Review the live session: ${sessionReplayUrl}`;
    s.approval.status = "done";

    return {
      steps,
      sessionReplayUrl,
      addedToCart,
      stoppedAtApproval: true,
      retailer,
      productName,
      finalUrl,
    };
  } catch (err) {
    // Mark the first non-done step as errored so the caller sees where it broke.
    const firstUnfinished = steps.find(
      (st) => st.status === "pending" || st.status === "running"
    );
    if (firstUnfinished) {
      firstUnfinished.status = "error";
      firstUnfinished.detail = `Failed: ${(err as Error).message}`;
    }
    // Even on failure, we never paid; surface a stopped-at-approval result.
    return {
      steps,
      sessionReplayUrl,
      addedToCart,
      stoppedAtApproval: true,
      retailer,
      productName,
      finalUrl,
    };
  } finally {
    // ALWAYS release the Browserbase session (minimal spend).
    await stagehand.close().catch(() => {});
  }
}
