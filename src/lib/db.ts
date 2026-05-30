import { Pool, type PoolConfig } from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env';

// Verify RDS TLS against AWS's public CA bundle (db/rds-global-bundle.pem).
// Download once: see scripts note / README. We do NOT disable cert verification.
const caPath = join(process.cwd(), 'db', 'rds-global-bundle.pem');
const ssl: PoolConfig['ssl'] = existsSync(caPath)
  ? { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
  : (() => {
      throw new Error(
        'Missing db/rds-global-bundle.pem (AWS RDS CA). Download it:\n' +
          '  curl -so db/rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem',
      );
    })();

export const pool = new Pool({ connectionString: env.databaseUrl(), ssl, max: 8 });

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
