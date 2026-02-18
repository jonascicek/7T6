# 7T6 Blog Starter

Minimal scaffold für einen Blog mit Vite + React (TypeScript) Frontend und Node.js (TypeScript, Express) Backend.

Schnellstart:

1. Frontend installieren und starten

```bash
cd frontend
npm install
npm run dev
```

2. Backend installieren und starten

```bash
cd backend
npm install
npm run dev
```

Das Frontend ruft die Upload-API unter `/api/upload` auf (development proxy oder gleiche Domain konfigurieren).

Hinweise:
- Konfiguriere Cloudinary via `backend/.env` (optional). Falls nicht vorhanden werden Uploads in `backend/uploads/` gespeichert.
- Dies ist ein Starter — Auth, DB (Prisma/Postgres), eBay-Integration und Deployment müssen noch ergänzt werden.
