# Strato V-Server Go-Live Security Checkliste (7T6)

Diese Liste ist bewusst in einer festen Reihenfolge aufgebaut. Arbeite sie von oben nach unten ab.

## 1) Domain und DNS

- [ ] Domain auf den neuen Server zeigen lassen (A/AAAA Record).
- [ ] Erst pruefen, ob die Domain bei Wix oder extern registriert ist.
- [ ] TTL vor der Umstellung auf einen niedrigen Wert setzen.
- [ ] Wix erst loeschen, wenn der neue Server stabil laeuft.

## 2) HTTPS und Zertifikat

- [ ] TLS/HTTPS aktivieren (Let's Encrypt oder Reverse Proxy mit Auto-TLS).
- [ ] HTTP auf HTTPS umleiten.
- [ ] HSTS erst aktivieren, wenn HTTPS stabil laeuft.

## 3) Backend absichern

- [x] Backend-Port 4000 NICHT oeffentlich im Internet veroeffentlichen.
- [ ] CORS_ORIGINS auf echte Domains setzen (keine localhost Origins in Production).
- [ ] JWT Secret + Admin Passwort final neu setzen, nur als Server-Env.

## 4) Production-Aenderungen

### 4.1 docker-compose (Production)

Aktuell veroeffentlicht dein Backend Port 4000 nach aussen. In Production sollte der Backend-Service nur intern erreichbar sein.

Ersetze in docker-compose.yml den Backend-Teil:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: 7t6-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      - CORS_ORIGINS=https://7t6.de,https://www.7t6.de
    volumes:
      - db-data:/app/prisma
      - uploads-data:/app/uploads
    expose:
      - "4000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

Wichtig:
- `ports: "4000:4000"` entfernen.
- `expose: "4000"` nutzen, damit nur Container-intern erreichbar.

Optional (wenn Frontend nur ueber Host-Reverse-Proxy laufen soll):

```yaml
  frontend:
    ports:
      - "127.0.0.1:8080:80"
```

Dann zeigt dein Host-Nginx/Caddy auf `127.0.0.1:8080`.

### 4.2 Nginx im Frontend-Container haerten

Ersetze den Inhalt von frontend/nginx.conf mit:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 25m;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ /\.|\.git {
        deny all;
        return 404;
    }
}
```

Hinweis zu HSTS:
- `Strict-Transport-Security` nur setzen, wenn HTTPS bereits stabil aktiv ist.

### 4.3 Backend .env fuer Production

Empfohlenes Muster:

```env
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://7t6.de,https://www.7t6.de
DATABASE_URL=file:./prisma/prod.db
ADMIN_EMAIL=dein-admin@deine-domain.de
ADMIN_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=<64+ zufaellige hex/chars>
JWT_EXPIRES_IN=2h
```

Nie committen:
- `.env`
- echte Credentials

## 5) Strato Server-Haertung (OS)

- [ ] System aktualisieren:

```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] Firewall aktivieren (nur 22, 80, 443):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

- [ ] SSH haerten:
  - [ ] Passwort-Login aus
  - [ ] Root-Login aus
  - [ ] nur SSH-Key Auth

- [ ] fail2ban aktivieren:

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 6) App Security Verifikation nach Deployment

- [ ] Container starten:

```bash
docker compose up -d --build
```

- [ ] Backend intern erreichbar, nicht extern:

```bash
ss -tulpen | grep 4000 || true
```

Erwartung: Kein oeffentliches `0.0.0.0:4000`.

- [ ] Healthcheck:

```bash
curl -i http://127.0.0.1:8080/api/posts
```

- [ ] Security Header pruefen:

```bash
curl -I https://7t6.de
curl -I https://7t6.de/api/posts
```

- [ ] Rate Limits testen (Login und Upload):
  - Mehrfach schnelle Requests senden, 429 muss kommen.

- [ ] CSRF-Schutz testen:
  - State-Change Requests mit falschem Origin muessen 403 liefern.

- [ ] Upload-Schutz testen:
  - Umbenannte Nicht-Bilddatei muss geblockt werden.

## 7) Frontend-Audit beheben

Dein aktueller Frontend-Audit zeigt ein High-Risiko bei `react-router` / `react-router-dom`.

Arbeitsreihenfolge:
- [ ] Genau pruefen, welche Versionen aktuell im Lockfile installiert sind.
- [ ] Entscheiden, ob ein Fix per Update moeglich ist oder ob die Version bewusst gehalten werden muss.
- [ ] Falls Update moeglich: betroffene Pakete und Lockfile sauber aktualisieren.
- [ ] Falls kein Update moeglich: Risiko mit kurzer Begruendung dokumentieren.
- [ ] Danach Frontend neu bauen und Audit erneut ausfuehren.

Konkrete Pruefung:
- [ ] `npm audit --omit=dev` im Frontend laufen lassen.
- [ ] `npm run build` im Frontend laufen lassen.
- [ ] Ergebnis notieren: behoben, akzeptiert oder noch offen.

Wenn ein Fix umgesetzt wird:
- [ ] Nur minimale Version aendern, die das Finding behebt.
- [ ] Danach testen, ob Routing, Admin-Login und Seitenwechsel weiter funktionieren.
- [ ] Erst danach diesen Punkt als erledigt markieren.

```bash
cd frontend && npm audit --omit=dev
cd ../backend && npm audit --omit=dev
```

---

## 8) Backup & Monitoring (Pflicht fuer Betrieb)

- [ ] Tägliches DB-Backup (Cron).
- [ ] Upload-Verzeichnis sichern.
- [ ] Restore-Test 1x durchspielen.
- [ ] Monitoring fuer CPU/RAM/Disk + App 5xx + Login-Fehlversuche.

Beispiel Backup (SQLite):

```bash
sqlite3 /pfad/zu/prod.db ".backup /pfad/backup/prod-$(date +%F).db"
```

---

## 9) Go/No-Go Entscheidung

Go-Live nur wenn ALLE Punkte erfuellt:
- [ ] HTTPS aktiv
- [ ] Backend 4000 nicht oeffentlich
- [ ] CORS nur echte Domain
- [ ] Admin-Login, CSRF, Rate-Limit, Upload-Validierung getestet
- [ ] Backup + Monitoring aktiv
- [ ] Offene Audit-Findings bewertet und dokumentiert
