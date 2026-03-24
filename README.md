# Compleme

Compleme is a high-performance, keyboard-accessible, and theme-aware task management dashboard built with Next.js and PostgreSQL. Designed with an IDE-inspired aesthetic, it helps developers and students organize their workflows using a robust Kanban-style interface.

## 🚀 Features

* **Drag and Drop Interface**: Reorder topics horizontally and drag todos vertically or across columns with lag-free, optimistic UI updates.
* **Fractional Indexing**: Persistent state ordering without database locking or expensive array recalcutations.
* **Theming Engine**: Dynamic CSS-variable based theming support for both light and dark modes (Zed, VS Code, GitHub, Dracula, Nord, Monokai, VS Light+, Solarized Light, and Catppuccin Latte).
* **Workspace Analytics**: Real-time progress trackers and visual metrics using circular and linear data visualizations.
* **Data Portability**: Full support for importing and exporting your entire workspace state as a CSV file.
* **Optimistic UI**: Instant interaction feedback with underlying background syncing.

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
* **Language**: TypeScript
* **Database**: PostgreSQL (via `pg` native driver)
* **Styling**: Pure CSS (No Tailwind)
* **Drag & Drop**: `@hello-pangea/dnd`
* **Package Manager**: [Bun](https://bun.sh/)

## 💻 Getting Started

### Prerequisites
* [Bun](https://bun.sh/) installed on your machine.
* A running instance of PostgreSQL.

### Local Initialization

1. **Clone the repository and install dependencies:**
   ```bash
   bun install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your PostgreSQL connection string:
   ```env
   # .env.local
   DATABASE_URL="postgres://username:password@localhost:5432/compleme"
   ```

3. **Initialize the Database Schema:**
   Run the initialization script to generate the required tables:
   ```bash
   bun run scripts/init-db.ts
   ```

4. **Start the Development Server:**
   ```bash
   bun run dev
   ```
   *Your app will now be running on [http://localhost:3000](http://localhost:3000).*

## ☁️ Deployment

Compleme is optimized for Vercel out of the box. 

1. Ensure your Production database (e.g. Supabase, Neon) connection string is mapped to `DATABASE_URL` in your Vercel Environment variables.
2. The included `vercel.json` ensures that Vercel uses `bun` to execute the build scripts correctly.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
