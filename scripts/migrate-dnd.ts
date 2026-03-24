import { db } from "../lib/db";

async function run() {
  try {
    console.log("Applying drag-and-drop migrations...");
    
    // Add position columns as DOUBLE PRECISION for fractional indexing
    await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION DEFAULT 0;`);
    await db.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION DEFAULT 0;`);
    
    // Initialize existing topics with a sequential integer position 
    // so they are spaced out nicely: 1000, 2000, 3000...
    await db.query(`
      UPDATE topics SET position = ranked.rn * 1000
      FROM (SELECT id, row_number() OVER (PARTITION BY category_id ORDER BY id) as rn FROM topics) as ranked
      WHERE topics.id = ranked.id AND topics.position = 0;
    `);
    
    // Initialize existing todos with sequential integer position
    await db.query(`
      UPDATE todos SET position = ranked.rn * 1000
      FROM (SELECT id, row_number() OVER (PARTITION BY topic_id ORDER BY id) as rn FROM todos) as ranked
      WHERE todos.id = ranked.id AND todos.position = 0;
    `);

    console.log("Migration complete successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
