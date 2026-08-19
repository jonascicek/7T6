# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer if package.json unchanged)
COPY package*.json ./
RUN npm config set fund false && npm config set audit false && npm ci --loglevel warn

# Copy Prisma schema and generate types BEFORE compiling TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ── Stage 2: Production ─────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm config set fund false && npm config set audit false && npm ci --omit=dev --loglevel warn

# Copy compiled JS from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

# Run DB migration then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
