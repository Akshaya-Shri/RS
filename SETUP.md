# Revathi Store Setup & Deployment Guide

## Prerequisites
1. Node.js (v18+)
2. MySQL Server
3. Git

## Local Setup
1. Open the project folder `revathi-store`.
2. Run `npm install` to install all Next.js, Tailwind, and Lottie dependencies.
3. Import the initial database schema from `schema.sql` into your MySQL server:
   ```bash
   mysql -u root -p < schema.sql
   ```
4. Create a `.env.local` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=revathi_store
   ```
5. Run `npm run dev` to start the development server.
6. Open `http://localhost:3000` in your browser to view the unique SVG animations and layout.

## Deployment to Vercel
1. Push the code to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com) and click "Add New Project".
3. Import your GitHub repository.
4. Configure Environment Variables within Vercel's settings (Add your production MySQL credentials. You will need a publicly accessible DB like PlanetScale, AWS RDS, or Railway).
5. Click **Deploy**. Vercel will automatically configure settings for Next.js App Router and deploy.
