# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production (Nginx) ─────────────────────────────────
FROM nginx:alpine AS production

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for React Router + API Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
