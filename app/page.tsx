import { db } from "@/lib/db";
import Dashboard from "@/app/components/Dashboard";
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const categoriesRes = await db.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY id ASC', [user.id]);
  const categories = categoriesRes.rows;

  let topics: any[] = [];
  let todos: any[] = [];

  if (categories.length > 0) {
    const catIds = categories.map(c => c.id);
    const topicsRes = await db.query(`SELECT * FROM topics WHERE category_id = ANY($1) ORDER BY id ASC`, [catIds]);
    topics = topicsRes.rows;

    if (topics.length > 0) {
      const topIds = topics.map(t => t.id);
      const todosRes = await db.query(`SELECT * FROM todos WHERE topic_id = ANY($1) ORDER BY id ASC`, [topIds]);
      todos = todosRes.rows;
    }
  }

  return (
    <div className="app-container">
      <Dashboard 
        username={user.username}
        initialCategories={categories} 
        initialTopics={topics} 
        initialTodos={todos} 
      />
    </div>
  );
}
