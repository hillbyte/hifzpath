# Hifz Path

> **A project built for the Quran Foundation Hackathon**  
> Organized & Sponsored by [Provision Launch](https://provisioncapital.com/) and the [Quran Foundation](https://quran.foundation/).

Hifz Path is a modern, scientifically-backed web application designed to help you memorize the Quran with ease. It combines bite-sized daily goals with the SM-2 spaced repetition algorithm to ensure permanent memorization, all presented in a sleek, distraction-free interface.

## Features 

- **Bite-Sized Daily Goals:** Set custom daily targets (even just one ayah a day).
- **Spaced Repetition:** SM-2 algorithm schedules reviews exactly when your brain is about to forget.
- **Track Everything:** Visual activity heatmap, lifetime ayah grid, and streak tracking.
- **Quran.com Integration:** Seamless login and synchronization with your Quran Foundation account.
- **Rich Experience:** Built-in audio playback, Tajweed colors, word-by-word translations, and Tafsir.

## Tech Stack

- **Frontend:** [SvelteKit](https://kit.svelte.dev/)
- **Backend:** [Hono](https://hono.dev/) (Node.js)
- **Database:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** Quran Foundation OAuth2

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 2. Environment Setup
Copy the example environment files and configure your local credentials:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

### 3. Installation
Install dependencies for both the frontend and backend:

```bash
npm install
```

### 4. Database Setup
I used Drizzle ORM for database management. You have a few options depending on your workflow:

**For quick local development:**
Directly sync your schema to the database without generating migration files:
```bash`
npm run db:push
```

**For traditional migration workflows:**
If you make changes to `schema.js`, generate SQL migration files first, then run them:
```bash
npm run db:generate  
npm run db:migrate   
```

### 5. Running Locally
Run both the frontend and backend development servers concurrently:

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
