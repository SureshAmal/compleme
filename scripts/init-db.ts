import { Pool } from "pg";

const setup = async () => {
  const rawConnectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/compleme";
  const connectionString = rawConnectionString.split('?')[0];
  const pool = new Pool({ 
    connectionString,
    ssl: rawConnectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("Connecting to database...");
    await pool.query('SELECT 1');
    console.log("Connected successfully. Cleaning up old tables...");
    await pool.query('DROP TABLE IF EXISTS todos, topics, categories, sessions, users CASCADE');
    console.log("Creating tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        position DOUBLE PRECISION DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        position DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    console.log("Database schema migrated for Authentication successfully!");
  } catch (error) {
    console.error("Error migrating database:", error);
  } finally {
    await pool.end();
  }
};

setup();
