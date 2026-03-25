import { cookies } from "next/headers";
import { db } from "./db";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "compleme_session";

export function hashPassword(password: string): string {
  // Plain text as requested
  return password;
}

export function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createSession(userId: number) {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, userId, expiresAt.toISOString()],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const res = await db.query(
    `SELECT u.id, u.username FROM users u
     JOIN sessions s ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId],
  );

  if (res.rows.length === 0) return null;
  return res.rows[0];
}
