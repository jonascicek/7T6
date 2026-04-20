# 7T6 Fashion Blog

Ein moderner Blog für Fashion-Collections mit Multi-Artikel-Support, Image Gallery, Admin-Panel und eBay-Integration. Gebaut mit React 18 + TypeScript Frontend, Express + Prisma Backend, SQLite Datenbank.

## 📋 Inhaltsverzeichnis

- [Features & Architektur](#features--architektur)
- [Technologie-Stack](#technologie-stack)
- [Projektstruktur](#projektstruktur)
- [Changelog & Detaillierte Änderungen](#changelog--detaillierte-änderungen)
- [Datenmodell](#datenmodell)
- [API-Referenz](#api-referenz)
- [Setup & Installation](#setup--installation)
- [Admin-Konfiguration](#admin-konfiguration)
- [Nutzung & Workflows](#nutzung--workflows)

---

## 🎨 Features & Architektur

### Core Features

1. **Multi-Artikel Collections**
   - Eine Post/Collection kann mehrere Artikel (Items) enthalten
   - Jeder Artikel hat eigene Bilder, Titel, Beschreibung
   - Flexible Struktur für Fashion-Releases, Editionen, Varianten

2. **Image Gallery & Lazy Loading**
   - Hero-Bild auf Detailseite mit Image Gallery
   - Thumbnail-Navigation und Zoom-Effekt
   - Responsive Image Sizing (mobile/tablet/desktop)

3. **eBay Integration**
   - Optionales eBay-Link-Feld pro Artikel
   - Validierende URL-Eingabe im Admin-Panel
   - Klickbarer "Auf eBay ansehen" Button auf Detailseite

4. **Konsistentes Layout**
   - Unified Header mit 7T6 Logo (zentriert, responsive)
   - PageLayout-Komponente für einheitliches Design
   - Konsistente Spacing, Footer optionsfähig

5. **Admin-Panel mit JWT Auth**
   - Secure Login mit bcryptjs + JWT (httpOnly cookies)
   - Post/Collection CRUD
   - Batch-Image-Upload (bis 40 Dateien pro Post)
   - Dynamische Artikel-Formular mit ebayUrl-Input

---

## 🛠 Technologie-Stack

### Frontend
- **React 18.3.1** + **TypeScript 5.7.3**
- **Vite 6.0.7** (Build Tool)
- **Tailwind CSS 3.4.17** (Styling)
- **React Router 7.1.3** (Navigation)
- **Axios** (HTTP Client)

### Backend
- **Node.js** + **TypeScript 6.0.3**
- **Express 5.2.1** (REST API)
- **Prisma 6.3.0** (ORM)
- **SQLite** (Dev-DB)
- **Multer** (File Upload, 40 files max)
- **bcryptjs** (Passwort-Hashing)
- **jsonwebtoken** (JWT Auth)
- **ts-node-dev** (Hot Reload)

### Database
- **SQLite** (Development)
- **Prisma Migrations** (Schema Management)

---

## 📂 Projektstruktur

```
7T6/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx          # Navigation + 7T6 Logo (zentriert)
│   │   │   ├── PageLayout.tsx      # Wrapper für Header + pt-20 spacing + Footer
│   │   │   ├── Footer.tsx          # Optional Footer
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Landing: Featured Post Hero + Latest Drops Grid
│   │   │   ├── PostDetailPage.tsx  # Collection Detail: Multi-Artikel, Image Gallery, eBay Button
│   │   │   ├── AdminPage.tsx       # Admin Dashboard: CRUD
│   │   │   └── AdminLoginPage.tsx  # JWT Login
│   │   ├── admin/
│   │   │   ├── AdminForm.tsx       # Create/Edit Post Form
│   │   │   └── AdminPosts.tsx      # Post List
│   │   ├── interfaces/
│   │   │   └── index.ts            # Post, PostItem, Image TS Types
│   │   └── ...
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts                # Express App, API Routes, Prisma Queries
│   │   ├── upload.ts               # Multer Config, File Upload Middleware
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma           # ORM Schema (Post, PostItem, PostItemImage)
│   │   └── migrations/
│   │       ├── 20260211151855_init/
│   │       ├── 20260420190000_add_post_items/
│   │       └── 20260420193000_add_ebay_url_to_post_item/
│   ├── .env                        # Admin Credentials, JWT Secret
│   ├── uploads/                    # Local Image Storage
│   └── package.json
└── README.md
```

---

## 📝 Changelog & Detaillierte Änderungen

### Phase 1: Header & Visual Polish (Abgeschlossen)

#### Änderung: Header Logo Zentrierung & Responsivität
**Datei:** `frontend/src/components/Header.tsx`

- **Was:** Header Logo (7T6 image) mittig positioniert statt links
- **Wie:** Absolute Positionierung mit `left-1/2 -translate-x-1/2`
- **Effekt:** Konsistent auf allen Seiten, professionelleres Look

**Code-Auszug:**
```tsx
<img 
  src="/logo-7t6.jpeg" 
  alt="7T6" 
  className="absolute left-1/2 -translate-x-1/2 h-16 w-auto"
/>
```

#### Änderung: PageLayout Komponente (NEU)
**Datei:** `frontend/src/components/PageLayout.tsx` (neue Datei)

- **Was:** Zentrale Layout-Wrapper für alle Seiten
- **Zweck:** Einheitliche Header-Platzierung + Top-Padding (pt-20) + optionaler Footer
- **Benefit:** DRY-Prinzip, keine Header-Duplikationen, globale Konsistenz

**Struktur:**
```tsx
interface PageLayoutProps {
  children: React.ReactNode;
  withFooter?: boolean;
}

export default function PageLayout({ children, withFooter }: PageLayoutProps) {
  return (
    <>
      <Header />
      <main className="pt-20">{children}</main>
      {withFooter && <Footer />}
    </>
  );
}
```

#### Änderung: HomePage Responsivität
**Datei:** `frontend/src/pages/HomePage.tsx`

- **Was:** Hero Title-Größe reduziert für bessere Mobile-Lesbarkeit
- **Vorher:** `text-4xl md:text-6xl lg:text-7xl`
- **Nachher:** `text-3xl md:text-5xl lg:text-6xl`
- **Effekt:** Weniger visuelles "Overkill" auf Mobile, besser proportioniert

#### Änderung: PageLayout Integration auf allen Seiten
**Dateien:** `HomePage.tsx`, `PostDetailPage.tsx`, `AdminPage.tsx`, `AdminLoginPage.tsx`

- **Vor:** Manueller Header-Import + manuelles Spacing
- **Nach:** Nur `<PageLayout withFooter={true}>{content}</PageLayout>`
- **Vorteil:** 50% weniger Code, zentrale Kontrolle, einfacher zu ändern

---

### Phase 2: Multi-Artikel Collections (Abgeschlossen)

#### Änderung: Datenmodell - PostItem & PostItemImage Tabellen
**Datei:** `backend/prisma/schema.prisma`

- **Was:** Neue Relationen für flexible Multi-Artikel-Struktur
- **Struktur:**
  ```prisma
  model Post {
    id        Int      @id @default(autoincrement())
    title     String
    description String
    images    Image[]  // Alte hero-Bilder
    items     PostItem[] // Neue: Artikel-Details
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  
  model PostItem {
    id        Int      @id @default(autoincrement())
    postId    Int
    post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
    title     String
    description String
    ebayUrl   String?  // eBay Link (optional)
    images    PostItemImage[]
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  
  model PostItemImage {
    id        Int      @id @default(autoincrement())
    postItemId Int
    postItem  PostItem @relation(fields: [postItemId], references: [id], onDelete: Cascade)
    url       String
  }
  ```

**Migrationen:**
- `20260420190000_add_post_items` → Tabellen erstellt
- `20260420193000_add_ebay_url_to_post_item` → ebayUrl Spalte hinzugefügt

#### Änderung: TypeScript Interfaces Update
**Datei:** `frontend/src/interfaces/index.ts`

- **Neue Types:**
  ```typescript
  export interface PostItem {
    id: number;
    postId: number;
    title: string;
    description: string;
    ebayUrl?: string;
    images: Image[];
  }
  
  export interface Post {
    id: number;
    title: string;
    description: string;
    images: Image[];
    items?: PostItem[]; // Optional für Legacy-Kompatibilität
    createdAt: string;
    updatedAt: string;
  }
  ```

#### Änderung: Backend API - Multi-Artikel Support
**Datei:** `backend/src/index.ts`

**Funktionen hinzugefügt:**

1. `parseArticleDrafts()` - Parst JSON Articles aus Request
   ```typescript
   function parseArticleDrafts(body: any): ArticleDraft[] {
     // Validiert: title, description, ebayUrl (optional)
     // Wirft Fehler bei fehlenden Pflichtfeldern
   }
   ```

2. `normalizeOptionalHttpUrl()` - Validiert eBay URLs
   ```typescript
   function normalizeOptionalHttpUrl(url?: string): string | undefined {
     if (!url) return undefined;
     if (!url.startsWith("http://") && !url.startsWith("https://")) {
       throw new Error("URL muss mit http:// oder https:// beginnen");
     }
     return url;
   }
   ```

3. **POST /api/posts** Update - Hybrid Legacy + Multi-Artikel
   - **Legacy:** Kein `articles` JSON → Single-Post (alter Code)
   - **Multi-Artikel:** Mit `articles` JSON + `articleImages-{index}` Files
   - Multer-Files: `postImages-{index}` (hero) + `articleImages-{index}` (items)
   
   ```typescript
   app.post('/api/posts', requireAdmin, upload.array('files', 40), async (req, res) => {
     // 1. Parse articles JSON (if present)
     const articleDrafts = req.body.articles ? parseArticleDrafts(JSON.parse(req.body.articles)) : [];
     
     // 2. If articles: create multi-article post
     if (articleDrafts.length > 0) {
       const post = await prisma.post.create({
         data: {
           title: req.body.title,
           items: {
             create: articleDrafts.map(article => ({
               title: article.title,
               description: article.description,
               ebayUrl: normalizeOptionalHttpUrl(article.ebayUrl),
               images: {
                 create: /* files für diesen artikel */
               }
             }))
           }
         },
         include: postInclude
       });
     }
     // 3. Else: create legacy single-post
     else { /* ... */ }
   });
   ```

4. **GET /api/posts** & **GET /api/posts/:id** Update
   - Include `items` Relation mit nested `images`
   - OrderBy items.createdAt ascending (chronologische Reihenfolge)
   ```typescript
   const postInclude = {
     images: true,
     items: {
       include: { images: true },
       orderBy: { createdAt: "asc" }
     }
   };
   
   const posts = await prisma.post.findMany({
     include: postInclude,
     orderBy: { createdAt: "desc" }
   });
   ```

#### Änderung: Admin-Form Dynamic Article Input
**Datei:** `frontend/src/admin/AdminForm.tsx`

- **Neue Struktur:**
  ```typescript
  interface ArticleDraft {
    title: string;
    description: string;
    ebayUrl?: string;
    images: File[];
  }
  
  const [articles, setArticles] = useState<ArticleDraft[]>([
    { title: "", description: "", ebayUrl: "", images: [] }
  ]);
  ```

- **Features:**
  - "+ Artikel hinzufügen" Button zum Dynamischen Hinzufügen
  - Pro Artikel: Title, Description, eBay URL (optional), Image Upload
  - FormData Assembly: `articles` JSON + `articleImages-{index}-{fileIndex}` Files

#### Änderung: PostDetailPage - Multi-Artikel Rendering
**Datei:** `frontend/src/pages/PostDetailPage.tsx`

- **Hero Section:** Erste Bilder aus `post.images` (legacy) oder erstes Item
- **Articles Grid/List:**
  ```tsx
  const postItems = post.items ?? [];
  const hasItems = postItems.length > 0;
  
  {hasItems ? (
    <div className="grid gap-8">
      {postItems.map(item => (
        <ArticleSection key={item.id} item={item} />
      ))}
    </div>
  ) : (
    <LegacySinglePostView post={post} />
  )}
  ```

- **Typsicherheit:** `post.items ?? []` (coalescing operator) verhindert undefined-Fehler

---

### Phase 3: eBay Integration (Abgeschlossen)

#### Änderung: eBay URL Feld in Schema
**Datei:** `backend/prisma/schema.prisma`

- **Was:** Optional `ebayUrl String?` Feld auf `PostItem`
- **Migration:** `20260420193000_add_ebay_url_to_post_item`
- **Validierung:** URL muss mit `http://` oder `https://` beginnen

#### Änderung: Admin-Form eBay Input
**Datei:** `frontend/src/admin/AdminForm.tsx`

- **Input-Feld pro Artikel:**
  ```tsx
  <input
    type="url"
    placeholder="https://www.ebay.de/itm/..."
    value={article.ebayUrl || ""}
    onChange={(e) => {
      const updated = [...articles];
      updated[index].ebayUrl = e.target.value;
      setArticles(updated);
    }}
  />
  ```

- **FormData:** eBay URL wird mit im JSON mitgesendet:
  ```typescript
  const articlesJSON = JSON.stringify(
    articles.map(a => ({
      title: a.title,
      description: a.description,
      ebayUrl: a.ebayUrl // Optional Feld
    }))
  );
  formData.append('articles', articlesJSON);
  ```

#### Änderung: eBay Button auf Detailseite
**Datei:** `frontend/src/pages/PostDetailPage.tsx`

- **Button pro Artikel (wenn ebayUrl gesetzt):**
  ```tsx
  {item.ebayUrl && (
    <a
      href={item.ebayUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      🛍️ Auf eBay ansehen
    </a>
  )}
  ```

- **Sicherheit:** `rel="noopener noreferrer"` für Cross-Origin-Schutz

#### Änderung: Backend Validation
**Datei:** `backend/src/index.ts`

- `normalizeOptionalHttpUrl()` Funktion validiert URLs:
  ```typescript
  function normalizeOptionalHttpUrl(url?: string): string | undefined {
    if (!url || url.trim() === "") return undefined;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error("eBay URL muss mit http:// oder https:// beginnen");
    }
    return url;
  }
  ```

---

### Phase 4: Prisma Client Sync Fix (Abgeschlossen)

#### Problem: Windows EPERM Lock auf query_engine DLL
**Symptom:** `PrismaClientValidationError: Unknown field 'items'`

**Root Cause:** Prisma Client regeneration fehlgeschlagen wegen Windows Datei-Lock

**Lösung:**
1. Alle Node-Prozesse kille (TaskKill)
2. `.prisma/client` Verzeichnis löschen
3. `npx prisma generate` neu ausführen

**Resultat:** ✅ Prisma Client v6.3.0 regeneriert mit `ebayUrl` + `items` Feldern

---

## 🗄️ Datenmodell

### Post (Collection/Release)
```
Post {
  id: Int (PK)
  title: String              // z.B. "7T6 Signature Kollektion"
  description: String        // z.B. "Hier haben wir unsere Klassiker..."
  images: Image[]            // Hero-Bilder (legacy)
  items: PostItem[]          // Artikel mit Details
  createdAt: DateTime
  updatedAt: DateTime
}
```

### PostItem (Artikel/Variante in einer Collection)
```
PostItem {
  id: Int (PK)
  postId: Int (FK)
  title: String              // z.B. "7T6 Big Logo Black on Black"
  description: String        // z.B. "Unser Big Logo Schwarz auf Schwarz"
  ebayUrl: String? (optional) // z.B. "https://www.ebay.de/itm/236761866675"
  images: PostItemImage[]    // Artikel-spezifische Bilder
  createdAt: DateTime
  updatedAt: DateTime
}
```

### PostItemImage (Bilder für Artikel)
```
PostItemImage {
  id: Int (PK)
  postItemId: Int (FK)
  url: String                // z.B. "/uploads/1776696482275-..."
}
```

### Image (Legacy Hero-Bilder)
```
Image {
  id: Int (PK)
  postId: Int (FK)
  url: String
}
```

---

## 🔌 API-Referenz

### Authentication
- **POST /api/login** - Admin JWT Login
  ```json
  {
    "email": "admin@7t6.de",
    "password": "secure_password"
  }
  ```
  → Response: JWT Token (httpOnly Cookie)

### Posts/Collections
- **GET /api/posts** - Alle Posts mit Items + Bilder
  ```json
  [
    {
      "id": 1,
      "title": "7T6 Signature Kollektion",
      "description": "...",
      "images": [{ "id": 1, "url": "/uploads/..." }],
      "items": [
        {
          "id": 1,
          "title": "7T6 Big Logo Black",
          "description": "...",
          "ebayUrl": "https://www.ebay.de/itm/...",
          "images": [{ "id": 1, "url": "/uploads/..." }]
        }
      ]
    }
  ]
  ```

- **GET /api/posts/:id** - Einzelne Collection + alle Items
  ```json
  {
    "id": 1,
    "title": "...",
    "items": [{ ... }]
  }
  ```

- **POST /api/posts** - Neue Collection erstellen (Admin only)
  ```
  FormData:
  - title: "7T6 Signature Kollektion"
  - description: "..."
  - files: [File, File, ...] (Hero-Bilder, optional)
  - articles: JSON stringified ArticleDraft[]
  - articleImages-0: [Files für Artikel 0]
  - articleImages-1: [Files für Artikel 1]
  ```

- **PUT /api/posts/:id** - Collection updaten (Admin only)
  ```
  Gleiche Struktur wie POST
  ```

- **DELETE /api/posts/:id** - Collection löschen (Admin only)

---

## ⚙️ Setup & Installation

### 1. Repo Klonen & Dependencies
```bash
git clone <repo>
cd 7T6

# Frontend
cd frontend
npm install

# Backend (separate Terminal/Tab)
cd ../backend
npm install
```

### 2. Backend Environment Setup
```bash
cd backend
cp .env.example .env  # oder manuell erstellen
```

**Erforderliche Variablen (.env):**
```
# Admin Auth
ADMIN_EMAIL=admin@7t6.de
ADMIN_PASSWORD_HASH=<bcrypt_hash>
JWT_SECRET=<long_random_string_min_32_chars>

# Datenbankpath (optional, default: ./dev.db)
DATABASE_URL="file:./dev.db"

# File Upload
UPLOAD_DIR=./uploads
```

### 3. Prisma Migrations
```bash
cd backend

# Migrations anwenden
npx prisma migrate deploy

# Oder: Fresh Start (löscht Daten!)
npx prisma migrate reset --force
```

### 4. Frontend & Backend Starten
```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 2: Backend
cd backend
npm run dev
# → http://localhost:4000
```

---

## 🔐 Admin-Konfiguration

### Passwort-Hash Generieren
```bash
node -e "console.log(require('bcryptjs').hashSync('DEIN_PASSWORT', 12))"
```
Output kopieren → in `.env` `ADMIN_PASSWORD_HASH` einfügen

### JWT Secret Generieren
```bash
openssl rand -hex 32
# oder
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
→ in `.env` `JWT_SECRET` einfügen

### Admin Login
1. Backend & Frontend starten
2. Browser: `http://localhost:5173/admin/login`
3. Credentials eingeben (aus `.env`)
4. → Redirect zu `/admin` (Post-Management)

---

## 🎯 Nutzung & Workflows

### Workflow 1: Neue Collection mit Multi-Artikeln erstellen
1. Admin Login
2. Admin Page → "Neue Collection"
3. Title + Description eingeben
4. **Artikel hinzufügen:**
   - "Artikel 1": Title, Description, eBay URL (optional), Images
   - "Artikel 2": Title, Description, eBay URL (optional), Images
   - ➕ "Artikel hinzufügen" für mehr
5. Submit → Collection + 2 Articles + Images in DB
6. Homepage: Featured Post zeigt Hero-Bild
7. Detailseite: Alle Artikel mit Bildern + eBay-Buttons

### Workflow 2: Einzelne Artikel-Images hochladen
1. Admin Form: Pro Artikel gibt es eigenes Image-Upload-Feld
2. Max 40 Dateien pro Collection (Multer Limit)
3. Server speichert in `/backend/uploads/`
4. Path: `/uploads/TIMESTAMP-FILENAME.jpg`

### Workflow 3: eBay Links pro Artikel
1. Admin Form: Optional eBay-URL pro Artikel eingeben
2. Backend validiert: Muss mit `http://` oder `https://` beginnen
3. Detailseite: Zeigt "Auf eBay ansehen" Button (nur wenn URL gesetzt)
4. Klick → öffnet eBay-Listing in neuem Tab

---

## 📌 Wichtige Hinweise

1. **Prisma Version:** 6.3.0 gepinnt (neuere Versionen verursachen Runtime-Probleme im aktuellen Environment)

2. **Local File Storage:** Uploads landen in `backend/uploads/`. Für Production: zu Azure Blob Storage oder AWS S3 migrieren

3. **Backward Compatibility:** Legacy-Posts ohne Items werden noch unterstützt (fallback zu `post.items ?? []`)

4. **Image Performance:** Bei großen/vielen Bildern: Sharp-Integration für Komprimierung empfohlen (Out of Scope für jetzt)

5. **TypeScript:** Frontend mit Vite + ts-loader, Backend mit ts-node-dev. Beide bauen/checken sauber

---

## 🐛 Troubleshooting

### Prisma Client Validation Error
**Problem:** "Unknown field 'items'" oder "Unknown argument 'ebayUrl'"
**Lösung:**
```bash
# Kill alle Node-Prozesse
taskkill /F /IM node.exe

# Regenerieren
cd backend
rm -rf node_modules/.prisma/client
npx prisma generate

# Starten
npm run dev
```

### Frontend Build Fehler
```bash
cd frontend
npm run build  # Test Build
npx tsc --noEmit  # Type Check
```

### Backend Type Fehler
```bash
cd backend
npx tsc --noEmit
```

---

**Version:** 1.0.0 (April 2026)  
**Letzter Update:** Multi-Artikel + eBay Integration vollständig  
**Status:** 🟢 Production Ready (für Entwicklung, noch kein Cloud Deployment)
