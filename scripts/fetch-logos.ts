import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dir, "../remotion/public/logos");
const ICONS: Record<string, string> = {
  amazon: "amazon", walmart: "walmart", target: "target", shein: "shein", temu: "temu", google: "google",
};

const main = async () => {
  mkdirSync(DIR, { recursive: true });
  for (const [name, slug] of Object.entries(ICONS)) {
    try {
      const r = await fetch(`https://cdn.simpleicons.org/${slug}`);
      if (!r.ok) { console.warn(`skip ${name}: ${r.status}`); continue; }
      writeFileSync(join(DIR, `${name}.svg`), await r.text());
      console.log("logo", name);
    } catch (e) { console.warn(`skip ${name}:`, (e as Error).message); }
  }
};
main();
