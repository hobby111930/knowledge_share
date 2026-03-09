<div align="center">

[English](./README.md) | [简体中文](./README.zh-CN.md)
</div>

# Meeting Report / OpenClaw Share

A modern, full-stack Next.js application designed to manage, display, and share meeting reports and media content. The platform allows users to create visually appealing meeting groups, upload related files (images and documents), drag-and-drop to reorder content, and view immersive, AI-assisted summaries alongside the media.

## ✨ Key Features

- **Group Management**: Create, edit, and organize meeting groups. Customize groups with distinct colors, thumbnails, and specific meeting times.
- **Content Management**: Upload images and files into groups. Reorder content intuitively via Drag-and-Drop. File deletions are safely synchronized with the local file system.
- **Immersive Share & Playback View**: A dedicated playback page to present reports dynamically. Users can view images side by side with Markdown-rendered AI summaries, complete with image navigation and a collapsible summary pane.
- **AI Integration**: Powered by Google's Gemini AI API to generate insightful and structured meeting intelligence.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router), React 19
- **Database**: Prisma ORM with SQLite (`better-sqlite3`)
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (Framer Motion)
- **Drag & Drop**: `@dnd-kit`
- **Markdown Rendering**: `react-markdown`
- **Icons**: `lucide-react`
- **AI**: `@google/genai` (Gemini)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your API keys and database URL:
```env
# SQLite Database URL
DATABASE_URL="file:./dev.db"

# Gemini AI API Key
GEMINI_API_KEY="your_api_key_here"
```

### 3. Initialize the Database
Sync your Prisma schema with the SQLite database:
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```text
meeting_share/
├── prisma/               # Prisma database schema (schema.prisma)
├── public/               # Static assets
├── docs/                 # Documentation
├── src/
│   ├── app/              # Next.js App Router (Pages, Layouts, API routes)
│   │   └── actions/      # Next.js Server Actions (e.g., group.ts)
│   ├── components/       # Reusable React UI components (Header, Cards, Drag/Drop items)
│   ├── data/             # Mock data or data utilities
│   ├── lib/              # Utility functions and library wrappers
│   ├── views/            # High-level page views and composite components
│   └── types/            # TypeScript type definitions
├── .env                  # Environment variables
└── package.json          # Project configuration and dependencies
```