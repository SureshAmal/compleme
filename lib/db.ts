import { Pool } from "pg";

const rawURL = process.env.DATABASE_URL || "";
const connectionString = rawURL.split('?')[0];

const pool = new Pool({
  connectionString,
  ssl: rawURL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
