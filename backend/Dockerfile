# syntax=docker/dockerfile:1
# Build context is the repo root (npm workspaces): docker compose up -d --build
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY packages/shared/package.json packages/shared/
COPY frontend/package.json frontend/
RUN npm ci -w backend -w packages/shared --ignore-scripts
COPY packages/shared packages/shared
COPY backend backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma \
 && npm run build -w packages/shared

# Dev mode (docker-compose.dev.yml bind-mounts backend/src). Polling (-L) because file
# events from Windows bind mounts don't reach the container.
FROM base AS dev
RUN npm install -g nodemon@3
ENV PATH=/app/node_modules/.bin:$PATH
WORKDIR /app/backend
CMD ["nodemon", "-L", "--watch", "src", "--ext", "ts,json", "--exec", "tsx src/server.ts"]

FROM base
RUN npm run build -w backend
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
