# ─── Backend ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Dependencias de sistema para better-sqlite3 (compilación nativa)
RUN apk add --no-cache python3 make g++

# ── Instalar dependencias ──────────────────────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Copiar código fuente ───────────────────────────────────────────────────
COPY prisma ./prisma
COPY src ./src
COPY public ./public
COPY server.js ./
COPY prisma.config.ts ./

# ── Generar Prisma Client ──────────────────────────────────────────────────
RUN npx prisma generate

# ── Variables de entorno por defecto ──────────────────────────────────────
ENV PORT=3000
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

EXPOSE 3000

# ── Entrypoint: migrar BD y arrancar ──────────────────────────────────────
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
