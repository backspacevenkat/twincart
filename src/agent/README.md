# TwinCart Browser-Checkout Agent (AP2 agentic checkout)

A **real** agentic checkout engine. It drives a real merchant product page in a
Browserbase cloud browser via Stagehand, opens the first matching product, adds
it to the cart, and **stops at the human-approval step**. It **never auto-pays**.

This is the AP2 ("Agent Payments Protocol") centerpiece: the agent does all the
shopping work up to — but never including — the moment of payment. A human
always approves the final purchase.

## Files

- `src/agent/checkout-agent.ts` — `runCheckoutAgent(input)`, the engine.
- `scripts/run-checkout-agent.ts` — CLI demo that calls it and prints the result.
- `scripts/browserbase-smoke.ts` — the verified Browserbase/Stagehand connection
  smoke test this agent's connection pattern was copied from.

## How to run

```bash
# Defaults: Walmart search for "AAA batteries 8 pack"
bun scripts/run-checkout-agent.ts

# Pick a retailer + product
bun scripts/run-checkout-agent.ts walmart "wireless mouse"
bun scripts/run-checkout-agent.ts target  "stanley tumbler" 40

# Or pass a full search URL + product name + optional maxPrice
bun scripts/run-checkout-agent.ts "https://www.walmart.com/search?q=usb+c+cable" "usb c cable"
```

Walmart / Target are more agent-friendly than SHEIN / Temu (which captcha more
aggressively). If one site bot-walls, try another.

## API

```ts
import { runCheckoutAgent } from "@/agent/checkout-agent";

const result = await runCheckoutAgent({
  url: "https://www.walmart.com/search?q=aaa%20batteries",
  productName: "AAA batteries 8 pack",
  retailer: "Walmart",
  maxPrice: 15, // optional price ceiling
});

// result = {
//   steps: [{ label, status, detail }, ...],   // 4 steps, UI-stepper vocabulary
//   sessionReplayUrl: "https://www.browserbase.com/sessions/<id>",
//   addedToCart: boolean,
//   stoppedAtApproval: true,                    // ALWAYS true — never pays
//   retailer, productName, finalUrl,
// }
```

Step labels (match the app's `AgentStepper` vocabulary, in order):

1. `Opening retailer`
2. `Locating product`
3. `Adding to cart`
4. `Awaiting your approval` ← hard stop; control returns to the human

## Environment variables

All read from `.env` (auto-loaded under `bun`). Never hardcoded.

| Var | Purpose |
| --- | --- |
| `BROWSERBASE_API_KEY` | Browserbase cloud-browser auth |
| `BROWSERBASE_PROJECT_ID` | Browserbase project (`4ff4895f-...`) |
| `OPENAI_API_KEY` | LLM used by Stagehand (read automatically by Stagehand) |
| `LLM_MODEL` | Optional. Stagehand model; defaults to `openai/gpt-5.4-mini`. A bare model name is auto-prefixed with `openai/`. |

Stagehand 3.4.0 notes (from the verified smoke test):

- `model` is a `"provider/model"` **string** (not `modelName`/`modelClientOptions`).
- `stagehand.init()` returns void; read the session id from
  `stagehand.browserbaseSessionID`.
- No `stagehand.page` getter — use `stagehand.context.pages()[0]`.

## Guardrails (enforced in `checkout-agent.ts`)

- Never enters payment / card data.
- Never clicks "Place order" / "Pay" / "Buy now" / "Complete purchase".
- Treats all on-page text as untrusted — only acts toward its own goal
  (open product → add to cart → stop).
- `try/finally` around the whole flow; **always** calls `stagehand.close()` to
  release the Browserbase session (minimal spend).
- Even on internal failure it returns `stoppedAtApproval: true` (it never paid).

## Wiring into the app (LATER — not done yet)

### The constraint

The TwinCart web app is a **static export**:

```ts
// next.config.ts
const nextConfig = { output: "export", /* ... */ };
```

A static export **cannot serve Next.js API routes / Route Handlers** — there is
no server at runtime. **Do NOT flip the whole app to SSR** just to run this
agent: that would change the entire deploy model (the app ships to AWS Amplify
as static files). It would also be wrong to run a long-lived headless-browser
session inside the Next server even if it existed.

### The recommended architecture

Deploy `runCheckoutAgent` as a **separate serverless function** that the static
site calls via `fetch` from the `CheckoutModal`. Two good options:

- **Vercel Function** (simplest): a standalone repo/project exposing one
  endpoint, e.g. `POST /api/checkout-agent`.
- **AWS Lambda** (keeps everything in AWS, matches the Amplify deploy): a Lambda
  behind an API Gateway / Function URL.

Either way the static Amplify site stays static and just `fetch`es the function.

### Concrete steps

1. **Create the function endpoint.** New project (Vercel) or Lambda handler that
   imports `runCheckoutAgent` and calls it:

   ```ts
   // api/checkout-agent  (Vercel function example)
   import { runCheckoutAgent } from "./checkout-agent"; // copy or import the file
   export const config = { maxDuration: 120 }; // browser runs ~30-90s

   export default async function handler(req, res) {
     // Validate the body with zod at the boundary.
     const { url, productName, retailer, maxPrice } = JSON.parse(req.body);
     const result = await runCheckoutAgent({ url, productName, retailer, maxPrice });
     res.status(200).json(result);
   }
   ```

   Set `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `OPENAI_API_KEY`,
   `LLM_MODEL` as **function** env vars (never in the static client bundle).

   **Timeout caveat:** a real run takes ~30-90s, exceeding most default
   serverless timeouts. Vercel Hobby caps at 10s (won't work — use Pro and set
   `maxDuration` up to 300s). AWS Lambda defaults to 3s — raise the timeout to
   at least 120s (max 900s).

2. **Expose the URL to the static site** via a build-time public env var, e.g.
   `NEXT_PUBLIC_CHECKOUT_AGENT_URL=https://<func-host>/api/checkout-agent`.

3. **Replace the simulated `AgentStepper`** in
   `src/components/TwinCartApp.tsx` (`CheckoutModal`). Today it animates fake
   steps. Change it to call the function and render the **real** steps it
   returns:

   ```ts
   const res = await fetch(process.env.NEXT_PUBLIC_CHECKOUT_AGENT_URL!, {
     method: "POST",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({ url, productName, retailer, maxPrice }),
   });
   const { steps, sessionReplayUrl, addedToCart, stoppedAtApproval } = await res.json();
   // Render `steps` in the existing stepper UI (labels already match).
   // Show a "Watch the agent" link to `sessionReplayUrl`.
   // The final step "Awaiting your approval" is where the human clicks Approve.
   ```

   The four step labels already match the existing stepper, so the UI maps 1:1.

4. **Optional — stream steps.** The one-shot `fetch` above returns the full step
   log when the run finishes. For a live stepper, upgrade the function to stream
   (SSE / chunked response) and have `runCheckoutAgent` accept an `onStep`
   callback that pushes each `AgentStep` as it transitions. The current return
   shape (`steps[]`) is already incremental-friendly.

5. **Human approval = payment boundary.** The agent stops at
   `Awaiting your approval` with the item in the cart and `stoppedAtApproval:
   true`. The actual payment is a **separate, human-initiated** step (e.g. an
   AP2 mandate / a real "Place order" click the user performs). The agent must
   never cross that line.

### CORS / security notes

- Lock the function's CORS to the Amplify site origin.
- Rate-limit the endpoint (one browser session is real spend).
- Validate the incoming `url` against an allowlist of retailer hosts before
  launching a browser — never let a caller point the agent at an arbitrary site.
