import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { uploadMiddleware } from './upload'
import path from 'path'
import { Prisma, PrismaClient } from '@prisma/client'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || ''
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h'
const adminEmail = typeof process.env.ADMIN_EMAIL === 'string'
  ? process.env.ADMIN_EMAIL.replace(/\s+/g, ' ').trim().toLowerCase()
  : ''
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || ''
const jwtCookieName = 'admin_token'
const tokenMaxAgeMsRaw = Number(process.env.JWT_MAX_AGE_MS || 2 * 60 * 60 * 1000)
const tokenMaxAgeMs = Number.isFinite(tokenMaxAgeMsRaw) && tokenMaxAgeMsRaw > 0
  ? tokenMaxAgeMsRaw
  : 2 * 60 * 60 * 1000
const isProd = process.env.NODE_ENV === 'production'

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!adminEmail || !adminPasswordHash || !jwtSecret) {
  console.warn('WARN: ADMIN_EMAIL, ADMIN_PASSWORD_HASH or JWT_SECRET is missing. Admin login is disabled.')
}

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

const parsePostId = (value: unknown) => {
  if (typeof value !== 'string') return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const validatePostPayload = (rawTitle: unknown, rawDescription: unknown) => {
  const title = normalizeText(rawTitle)
  const description = normalizeText(rawDescription)

  if (!title || !description) {
    return { error: 'title und description erforderlich' as const }
  }

  if (title.length > 140) {
    return { error: 'title darf maximal 140 Zeichen haben' as const }
  }

  if (description.length > 4000) {
    return { error: 'description darf maximal 4000 Zeichen haben' as const }
  }

  return { title, description }
}

type ArticleDraft = {
  title: string
  description: string
  ebayUrl: string | null
}

const normalizeOptionalHttpUrl = (value: unknown) => {
  const raw = normalizeText(value)
  if (!raw) return null

  if (raw.length > 2048) {
    return null
  }

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

const parseArticleDrafts = (value: unknown): ArticleDraft[] | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return null
    }

    const drafts: ArticleDraft[] = []
    for (const item of parsed) {
      const title = normalizeText((item as { title?: unknown })?.title)
      const description = normalizeText((item as { description?: unknown })?.description)
      const rawEbayUrl = (item as { ebayUrl?: unknown })?.ebayUrl
      const ebayUrl = normalizeOptionalHttpUrl(rawEbayUrl)

      if (!title || !description) {
        return null
      }

      if (typeof rawEbayUrl === 'string' && normalizeText(rawEbayUrl) && !ebayUrl) {
        return null
      }

      if (title.length > 140 || description.length > 4000) {
        return null
      }

      drafts.push({ title, description, ebayUrl })
    }

    return drafts.length > 0 ? drafts : null
  } catch {
    return null
  }
}

const postInclude = {
  images: true,
  items: {
    include: { images: true },
    orderBy: { createdAt: 'asc' as const },
  },
}

const isAdminAuthConfigured = () => Boolean(adminEmail && adminPasswordHash && jwtSecret)

type AdminJwtPayload = JwtPayload & {
  sub: string
  role: 'admin'
}

const createAdminToken = () => {
  const signOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: jwtExpiresIn as SignOptions['expiresIn'],
    issuer: '7t6-backend',
    audience: '7t6-admin',
  }

  return jwt.sign(
    {
      role: 'admin',
    },
    jwtSecret,
    {
      ...signOptions,
      subject: adminEmail,
    }
  )
}

const readTokenFromRequest = (req: express.Request) => {
  const authHeader = req.header('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }

  const cookieToken = req.cookies?.[jwtCookieName]
  return typeof cookieToken === 'string' ? cookieToken : ''
}

const verifyAdminToken = (token: string): AdminJwtPayload | null => {
  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: '7t6-backend',
      audience: '7t6-admin',
      algorithms: ['HS256'],
    })

    if (typeof payload !== 'object' || !payload) {
      return null
    }

    const jwtPayload = payload as AdminJwtPayload
    if (jwtPayload.role !== 'admin' || jwtPayload.sub !== adminEmail) {
      return null
    }

    return jwtPayload
  } catch {
    return null
  }
}

const requireAdminAuth: express.RequestHandler = (req, res, next) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'admin auth is not configured on the server',
    })
  }

  const token = readTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  const payload = verifyAdminToken(token)
  if (!payload) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  res.locals.adminEmail = payload.sub
  next()
}

const adminAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'too many login attempts, try again later' },
})

app.post('/api/admin/login', adminAuthLimiter, async (req, res) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({ ok: false, error: 'admin auth is not configured on the server' })
  }

  const email = normalizeText(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!email || !password || email.length > 320 || password.length > 200) {
    return res.status(400).json({ ok: false, error: 'invalid credentials payload' })
  }

  if (email !== adminEmail) {
    return res.status(401).json({ ok: false, error: 'invalid credentials' })
  }

  const isPasswordValid = await bcrypt.compare(password, adminPasswordHash).catch(() => false)
  if (!isPasswordValid) {
    return res.status(401).json({ ok: false, error: 'invalid credentials' })
  }

  const token = createAdminToken()

  res.cookie(jwtCookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api',
    maxAge: tokenMaxAgeMs,
  })

  return res.json({ ok: true })
})

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  res.clearCookie(jwtCookieName, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api',
  })

  return res.json({ ok: true })
})

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  return res.json({ ok: true, email: res.locals.adminEmail })
})

// POST /api/posts — erstelle neue Kollektion mit einem oder mehreren Artikeln
app.post('/api/posts', requireAdminAuth, uploadMiddleware.any(), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || []
    const validated = validatePostPayload(req.body.title, req.body.description)

    if ('error' in validated) {
      return res.status(400).json({ ok: false, error: validated.error })
    }

    const articleDrafts = parseArticleDrafts(req.body.articles)

    if (articleDrafts) {
      const filesByArticle = new Map<number, Express.Multer.File[]>()

      for (const file of files) {
        const match = /^articleImages-(\d+)$/.exec(file.fieldname)
        if (!match) continue
        const index = Number(match[1])
        const existing = filesByArticle.get(index) || []
        existing.push(file)
        filesByArticle.set(index, existing)
      }

      if (filesByArticle.size === 0) {
        return res.status(400).json({ ok: false, error: 'mindestens ein Bild pro Artikel ist erforderlich' })
      }

      for (let i = 0; i < articleDrafts.length; i += 1) {
        const itemFiles = filesByArticle.get(i) || []
        if (itemFiles.length === 0) {
          return res.status(400).json({ ok: false, error: `artikel ${i + 1} benoetigt mindestens ein Bild` })
        }
      }

      const firstArticleFiles = filesByArticle.get(0) || []

      const post = await prisma.post.create({
        data: {
          title: validated.title,
          description: validated.description,
          images: {
            create: firstArticleFiles.map((f) => ({
              url: '/uploads/' + f.filename,
            })),
          },
          items: {
            create: articleDrafts.map((draft, index) => ({
              title: draft.title,
              description: draft.description,
              ebayUrl: draft.ebayUrl,
              images: {
                create: (filesByArticle.get(index) || []).map((f) => ({
                  url: '/uploads/' + f.filename,
                })),
              },
            })),
          },
        },
        include: postInclude,
      })

      return res.json({ ok: true, post })
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ ok: false, error: 'mindestens ein Bild ist erforderlich' })
    }

    // Speichere Post + Images in DB
    const post = await prisma.post.create({
      data: {
        title: validated.title,
        description: validated.description,
        images: {
          create: files.map((f) => ({
            url: '/uploads/' + f.filename,
          })),
        },
      },
      include: postInclude,
    })

    res.json({ ok: true, post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'post creation failed' })
  }
})


// GET /api/posts — alle Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: postInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ ok: true, posts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'fetch failed' })
  }
})

// GET /api/posts/:id — einzelner Post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const id = parsePostId(req.params.id)
    if (!id) {
      return res.status(400).json({ ok: false, error: 'invalid post id' })
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: postInclude,
    })
    if (!post) return res.status(404).json({ ok: false, error: 'post not found' })
    res.json({ ok: true, post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'fetch failed' })
  }
})

// PUT /api/posts/:id — update title/description
app.put('/api/posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parsePostId(req.params.id)
    if (!id) {
      return res.status(400).json({ ok: false, error: 'invalid post id' })
    }

    const validated = validatePostPayload(req.body.title, req.body.description)
    if ('error' in validated) {
      return res.status(400).json({ ok: false, error: validated.error })
    }

    const post = await prisma.post.update({
      where: { id },
      data: { title: validated.title, description: validated.description },
      include: postInclude,
    })
    res.json({ ok: true, post })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }
    console.error(err)
    res.status(500).json({ ok: false, error: 'update failed' })
  }
})

// DELETE /api/posts/:id — delete post
app.delete('/api/posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parsePostId(req.params.id)
    if (!id) {
      return res.status(400).json({ ok: false, error: 'invalid post id' })
    }

    await prisma.post.delete({
      where: { id },
    })
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }
    console.error(err)
    res.status(500).json({ ok: false, error: 'delete failed' })
  }
})

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, error: 'Datei zu gross (max 20MB pro Bild)' })
    }

    return res.status(400).json({ ok: false, error: 'ungueltiger Upload' })
  }

  if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ ok: false, error: 'Nur JPG, PNG, WebP oder AVIF Bilder erlaubt' })
  }

  if (err instanceof Error && err.message === 'INVALID_FILE_FIELD') {
    return res.status(400).json({ ok: false, error: 'Ungueltiges Upload-Feld' })
  }

  return next(err)
})

// Serve uploaded files in dev from backend/uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    index: false,
    maxAge: '7d',
  })
)

const server = app.listen(port, () => console.log(`Backend running on http://localhost:${port}`))

const shutdown = async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
