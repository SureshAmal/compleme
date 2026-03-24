"use server"

import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { hashPassword, createSession, clearSession, getUserFromSession } from "../lib/auth";
import { redirect } from "next/navigation";

export async function loginUser(username: string, pass: string) {
  const res = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (res.rows.length === 0) return { error: "Invalid username or password" };
  
  const user = res.rows[0];
  if (user.password !== pass) return { error: "Invalid username or password" };
  
  await createSession(user.id);
  redirect("/");
}

export async function registerUser(username: string, pass: string) {
  const existing = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) return { error: "Username already exists" };
  
  const res = await db.query(
    "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
    [username, pass]
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
  await db.query("INSERT INTO topics (category_id, name, position) VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1000 FROM topics WHERE category_id = $1))", [categoryId, name]);
  revalidatePath("/");
}

export async function addTodo(topicId: number, text: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("INSERT INTO todos (topic_id, text, position) VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1000 FROM todos WHERE topic_id = $1))", [topicId, text]);
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

export async function reorderTopic(id: number, newPosition: number) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("UPDATE topics SET position = $1 WHERE id = $2", [newPosition, id]);
  revalidatePath("/");
}

export async function reorderTodo(id: number, topicId: number, newPosition: number) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };
  await db.query("UPDATE todos SET topic_id = $1, position = $2 WHERE id = $3", [topicId, newPosition, id]);
  revalidatePath("/");
}

function parseCSVLine(str: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let word = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"') {
      if (i + 1 < str.length && str[i + 1] === '"') {
        word += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (str[i] === ',' && !inQuotes) {
      result.push(word.trim());
      word = '';
    } else {
      word += str[i];
    }
  }
  result.push(word.trim());
  return result;
}

export async function importCsvData(csvText: string) {
  const user = await getUserFromSession();
  if (!user) return { error: "Not logged in" };

  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return { error: "No data found or file contains only headers" };

  // Remove header
  const header = lines.shift();

  const categoryMap = new Map<string, number>();
  const topicMap = new Map<string, number>();

  for (const line of lines) {
    const row = parseCSVLine(line);
    if (row.length < 3) continue;

    const [categoryName, topicName, todoText, statusStr] = row;
    if (!categoryName || categoryName.trim() === '') continue;

    // Find or create category
    let catId = categoryMap.get(categoryName);
    if (!catId) {
      const catRes = await db.query('SELECT id FROM categories WHERE user_id = $1 AND name = $2', [user.id, categoryName]);
      if (catRes.rows.length > 0) {
        catId = catRes.rows[0].id;
      } else {
        const insertCat = await db.query('INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id', [user.id, categoryName]);
        catId = insertCat.rows[0].id;
      }
      categoryMap.set(categoryName, catId as number);
    }

    if (!topicName || topicName.trim() === '') continue;

    // Find or create topic
    const topicKey = `${catId}-${topicName}`;
    let topId = topicMap.get(topicKey);
    if (!topId) {
      const topRes = await db.query('SELECT id FROM topics WHERE category_id = $1 AND name = $2', [catId as number, topicName]);
      if (topRes.rows.length > 0) {
        topId = topRes.rows[0].id;
      } else {
        const insertTop = await db.query('INSERT INTO topics (category_id, name) VALUES ($1, $2) RETURNING id', [catId as number, topicName]);
        topId = insertTop.rows[0].id;
      }
      topicMap.set(topicKey, topId as number);
    }

    if (!todoText || todoText.trim() === '') continue;

    // Insert todo
    const isCompleted = statusStr?.trim().toLowerCase() === 'completed';
    await db.query('INSERT INTO todos (topic_id, text, is_completed) VALUES ($1, $2, $3)', [topId as number, todoText, isCompleted]);
  }

  revalidatePath("/");
  return { success: true };
}
