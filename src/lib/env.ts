import { config } from 'dotenv';
config(); // load .env

/** Read a required env var by name (throws if missing). */
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
/** Read an optional env var by name. */
const opt = (name: string, fallback = ''): string => process.env[name] ?? fallback;

// All access is name-based via helpers — no literal credential values in source.
export const env = {
  databaseUrl: () => req('DATABASE_URL'),
  apifyToken: () => (process.env.APIFY_USE_TOKEN === '2' && process.env.APIFY_TOKEN_2 ? process.env.APIFY_TOKEN_2 : req('APIFY_TOKEN')),
  anthropicKey: () => req('ANTHROPIC_API_KEY'),
  openaiKey: () => opt('OPENAI_API_KEY'),
  llmModel: () => opt('LLM_MODEL', 'claude-opus-4-8'),
  box: () => ({
    devToken: opt('BOX_DEVELOPER_TOKEN'),
    clientId: opt('BOX_CLIENT_ID'),
    clientSecret: opt('BOX_CLIENT_SECRET'),
    enterpriseId: opt('BOX_ENTERPRISE_ID'),
    reportsFolderId: opt('BOX_REPORTS_FOLDER_ID', '0'),
  }),
  typesense: () => ({
    host: opt('TYPESENSE_HOST', 'localhost'),
    port: Number(opt('TYPESENSE_PORT', '8108')),
    protocol: opt('TYPESENSE_PROTOCOL', 'http'),
    apiKey: opt('TYPESENSE_API_KEY', 'twincart-dev'),
  }),
  ucpSandboxUrl: () => opt('UCP_SANDBOX_URL', 'https://puddingheroes.com'),
  ingestConfirmed: () => opt('INGEST_CONFIRM') === '1', // safety gate for paid Apify runs
};
