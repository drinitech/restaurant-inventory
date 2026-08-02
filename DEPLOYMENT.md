# Deployment

This is a local-first build. Nothing below has been provisioned yet — these are
the steps to follow when you're ready to put it online.

## Backend → Render

1. Push this repo to GitHub (private, `drinitech` org).
2. In Render: **New → Blueprint**, point it at the repo. It will read
   `render.yaml` at the repo root and create the `restaurant-inventory-backend`
   web service (root dir `.`, build installs the whole workspace then builds
   `packages/shared` and `backend`).
3. Set these env vars on the service (Render dashboard → Environment):
   - `DATABASE_URL` — Neon **pooled** connection string (`-pooler` host),
     with `pgbouncer=true&connect_limit=20` appended, same as `backend/.env`.
   - `DIRECT_URL` — Neon **direct** (non-pooled) connection string. Only used
     for `prisma migrate`, never at runtime.
   - `CORS_ORIGIN` — the deployed frontend URL (e.g. `https://<app>.vercel.app`).
   - `JWT_SECRET` — Render can auto-generate this (already flagged
     `generateValue: true`), or set your own.
4. Run the initial migration against production once, from your machine:
   ```
   cd backend
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```
   (`migrate deploy` applies existing migrations without generating new ones —
   safe for production, unlike `migrate dev`.)
5. Optionally seed production data the same way with `npx prisma db seed`,
   or skip it and create the first Restaurant/Admin user by hand.

## Frontend → Vercel

1. In Vercel: **New Project**, import the same GitHub repo.
2. Set **Root Directory** to `frontend` in the project settings (this is a
   monorepo — Vercel needs to know which subfolder is the Next.js app).
3. Env vars (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` — the Render backend URL, e.g.
     `https://restaurant-inventory-backend.onrender.com`.
   - `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID` — the seeded restaurant's id
     (`seed-restaurant` if you used the provided seed script).
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
     — same Cloudinary values used locally.
4. Deploy. Build command/output are Next.js defaults — no override needed.

## After both are live

Update the backend's `CORS_ORIGIN` to the real Vercel URL (it can only list one
origin as configured) and redeploy the backend so the frontend can call it.
