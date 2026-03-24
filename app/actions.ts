"use server"

import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { hashPassword, createSession, clearSession, getUserFromSession } from "../lib/auth";
import { redirect } from "next/navigation";

export async function loginUser(username: string, pass: string) {
  const res = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (res.rows.length === 0) return { error: "Invalid username or password" };
  
  const user = res.rows[0];
  const hashed = hashPassword(pass);
  if (user.password_hash !== hashed) return { error: "Invalid username or password" };
  
  await createSession(user.id);
  redirect("/");
}

export async function registerUser(username: string, pass: string) {
  const existing = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) return { error: "Username already exists" };
  
  const hashed = hashPassword(pass);
  const res = await db.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
    [username, hashed]
  );
  
  const newUserId = res.rows[0].id;
  await createSession(newUserId);
  redirect("/");
}

export async function logoutUser() {
  await clearSession();
  redirect("/login");
}

export async function addCategory(name: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("INSERT INTO categories (user_id, name) VALUES ($1, $2)", [user.id, name]);
  revalidatePath("/");
}

export async function addTopic(categoryId: number, name: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("INSERT INTO topics (category_id, name) VALUES ($1, $2)", [categoryId, name]);
  revalidatePath("/");
}

export async function addTodo(topicId: number, text: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("INSERT INTO todos (topic_id, text) VALUES ($1, $2)", [topicId, text]);
  revalidatePath("/");
}

export async function toggleTodo(id: number, isCompleted: boolean) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  const completedAt = isCompleted ? new Date().toISOString() : null;
  await db.query("UPDATE todos SET is_completed = $1, completed_at = $2 WHERE id = $3", [isCompleted, completedAt, id]);
  revalidatePath("/");
}

export async function deleteTodo(id: number) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("DELETE FROM todos WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function deleteTopic(id: number) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("DELETE FROM topics WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("DELETE FROM categories WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function renameTodo(id: number, text: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("UPDATE todos SET text = $1 WHERE id = $2", [text, id]);
  revalidatePath("/");
}

export async function renameTopic(id: number, name: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("UPDATE topics SET name = $1 WHERE id = $2", [name, id]);
  revalidatePath("/");
}

export async function renameCategory(id: number, name: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("UPDATE categories SET name = $1 WHERE id = $2", [name, id]);
  revalidatePath("/");
}
