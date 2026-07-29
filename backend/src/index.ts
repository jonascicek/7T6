import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { uploadMiddleware, validateUploadedFile } from './upload'
import { logger } from './logger'
import path from 'path'
import fs from 'fs'
import { Prisma, PrismaClient } from '@prisma/client'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'

dotenv.config()

// Environment Validation - Fail fast if critical config is missing
const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const message = `Missing critical environment variables: ${missing.join(', ')}`
    logger.error(message)
    
    // In production, fail immediately
    if (process.env.NODE_ENV === 'production') {
      console.error(`FATAL: ${message}`)
      process.exit(1)
    }
    
    // In development, warn but continue
    logger.warn(message)
  }
}

validateEnvironment()

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || ''
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h'
const adminEmail = typeof process.env.ADMIN_EMAIL === 'string'
  ? process.env.ADMIN_EMAIL.replace(/\s+/g, ' ').trim().toLowerCase()
  : ''
// Support both raw "$2b$..." and compose-escaped "$$2b$$..." hash formats.
const adminPasswordHash = (process.env.ADMIN_PASSWORD_HASH || '').replace(/\$\$/g, '$')
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
  logger.warn('WARN: ADMIN_EMAIL, ADMIN_PASSWORD_HASH or JWT_SECRET is missing. Admin login is disabled.')
}

app.disable('x-powered-by')

// Only trust proxy headers in production to prevent X-Forwarded-For spoofing
if (isProd) {
  app.set('trust proxy', 1)
}

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

// Rate limiter specifically for file uploads (stricter limits to prevent abuse)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 upload requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many upload requests, please try again later',
})

app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

// Health Check Endpoint - for monitoring & load balancers
let dbHealthy = false
let appStartTime = new Date()

// Check database connection on startup
;(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    dbHealthy = true
    logger.info('Database connection established')
  } catch (err) {
    dbHealthy = false
    logger.error('Database connection failed at startup', err instanceof Error ? err : { message: String(err) })
  }
})()

app.get('/health', async (req, res) => {
  // Try to verify DB connection on each health check
  try {
    await prisma.$queryRaw`SELECT 1`
    dbHealthy = true
  } catch {
    dbHealthy = false
  }

  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    appStartTime: appStartTime.toISOString(),
  }
  
  const statusCode = dbHealthy ? 200 : 503
  res.status(statusCode).json(health)
})

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

type ItemUpdateDraft = {
  id: number
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

const parseItemUpdateDrafts = (value: unknown): ItemUpdateDraft[] | null => {
  if (typeof value !== 'object' || !value || !Array.isArray(value)) {
    return null
  }

  const drafts: ItemUpdateDraft[] = []
  for (const item of value) {
    const idValue = (item as { id?: unknown })?.id
    const id = typeof idValue === 'number' ? idValue : Number(idValue)
    const title = normalizeText((item as { title?: unknown })?.title)
    const description = normalizeText((item as { description?: unknown })?.description)
    const rawEbayUrl = (item as { ebayUrl?: unknown })?.ebayUrl
    const ebayUrl = normalizeOptionalHttpUrl(rawEbayUrl)

    if (!Number.isInteger(id) || id <= 0 || !title || !description) {
      return null
    }

    if (typeof rawEbayUrl === 'string' && normalizeText(rawEbayUrl) && !ebayUrl) {
      return null
    }

    if (title.length > 140 || description.length > 4000) {
      return null
    }

    drafts.push({ id, title, description, ebayUrl })
  }

  return drafts.length > 0 ? drafts : null
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

// CSRF protection: validate Origin header for state-changing requests (POST, PUT, DELETE)
const validateOriginHeader: express.RequestHandler = (req, res, next) => {
  // Only validate for state-changing methods; GET/OPTIONS are safe (idempotent)
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next()
  }

  const origin = req.get('origin')
  const clientIp = req.ip || 'unknown'
  
  // If no origin header is present, reject (browser always sends origin for cross-site requests)
  if (!origin) {
    logger.warn('Request without Origin header (potential CSRF)', {
      method: req.method,
      url: req.path,
      clientIp,
    })
    return res.status(403).json({ ok: false, error: 'Origin header is missing' })
  }

  // Check if origin is in allowedOrigins list
  const isAllowed = allowedOrigins.includes(origin)
  if (!isAllowed) {
    logger.warn('CSRF attempt detected', {
      origin,
      allowedOrigins,
      method: req.method,
      url: req.path,
      clientIp,
    })
    return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  }

  next()
}

const adminAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'too many login attempts, try again later' },
})

app.post('/api/admin/login', validateOriginHeader, adminAuthLimiter, async (req, res) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({ ok: false, error: 'admin auth is not configured on the server' })
  }

  const email = normalizeText(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const clientIp = req.ip || 'unknown'

  if (!email || !password || email.length > 320 || password.length > 200) {
    logger.warn('Invalid login payload', { email, clientIp })
    return res.status(400).json({ ok: false, error: 'invalid credentials payload' })
  }

  if (email !== adminEmail) {
    logger.warn('Login attempt with invalid email', { email, clientIp })
    return res.status(401).json({ ok: false, error: 'invalid credentials' })
  }

  const isPasswordValid = await bcrypt.compare(password, adminPasswordHash).catch(() => false)
  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { email, clientIp })
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

  logger.info('Admin login successful', { email, clientIp })
  return res.json({ ok: true })
})

app.post('/api/admin/logout', validateOriginHeader, requireAdminAuth, (req, res) => {
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
app.post('/api/posts', validateOriginHeader, uploadLimiter, requireAdminAuth, uploadMiddleware.any(), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || []
    
    // Validate all uploaded files by checking actual content (magic bytes)
    const invalidFiles: string[] = []
    for (const file of files) {
      const validation = await validateUploadedFile(file.path, file.originalname)
      if (!validation.valid) {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignore cleanup errors
        }
        invalidFiles.push(`${file.originalname}: ${validation.error}`)
      }
    }

    if (invalidFiles.length > 0) {
      return res.status(400).json({ ok: false, error: `Invalid files: ${invalidFiles.join('; ')}` })
    }

    const validated = validatePostPayload(req.body.title, req.body.description)

    if ('error' in validated) {
      // Cleanup all files on validation error
      for (const file of files) {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
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
        // Cleanup all files on validation error
        for (const file of files) {
          try {
            fs.unlinkSync(file.path)
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        return res.status(400).json({ ok: false, error: 'mindestens ein Bild pro Artikel ist erforderlich' })
      }

      for (let i = 0; i < articleDrafts.length; i += 1) {
        const itemFiles = filesByArticle.get(i) || []
        if (itemFiles.length === 0) {
          // Cleanup all files on validation error
          for (const file of files) {
            try {
              fs.unlinkSync(file.path)
            } catch (e) {
              // Ignore cleanup errors
            }
          }
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

// POST /api/post-items/:itemId/images — add images to an existing article
app.post('/api/post-items/:itemId/images', validateOriginHeader, uploadLimiter, requireAdminAuth, uploadMiddleware.array('files', 20), async (req, res) => {
  try {
    const itemId = parsePostId(req.params.itemId)
    if (!itemId) {
      return res.status(400).json({ ok: false, error: 'invalid post item id' })
    }

    const files = (req.files as Express.Multer.File[]) || []
    
    // Validate all uploaded files by checking actual content (magic bytes)
    const invalidFiles: string[] = []
    for (const file of files) {
      const validation = await validateUploadedFile(file.path, file.originalname)
      if (!validation.valid) {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignore cleanup errors
        }
        invalidFiles.push(`${file.originalname}: ${validation.error}`)
      }
    }

    if (invalidFiles.length > 0) {
      return res.status(400).json({ ok: false, error: `Invalid files: ${invalidFiles.join('; ')}` })
    }
    
    if (files.length === 0) {
      return res.status(400).json({ ok: false, error: 'mindestens ein Bild ist erforderlich' })
    }

    const item = await prisma.postItem.findUnique({ where: { id: itemId }, select: { id: true } })
    if (!item) {
      // Cleanup all files
      for (const file of files) {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      return res.status(404).json({ ok: false, error: 'post item not found' })
    }

    await prisma.postItemImage.createMany({
      data: files.map((file) => ({
        postItemId: itemId,
        url: '/uploads/' + file.filename,
      })),
    })

    const updatedItem = await prisma.postItem.findUnique({
      where: { id: itemId },
      include: { images: { orderBy: { createdAt: 'asc' } } },
    })

    return res.json({ ok: true, item: updatedItem })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, error: 'item image upload failed' })
  }
})

// DELETE /api/post-items/:itemId/images/:imageId — remove one image from an article
app.delete('/api/post-items/:itemId/images/:imageId', validateOriginHeader, requireAdminAuth, async (req, res) => {
  try {
    const itemId = parsePostId(req.params.itemId)
    const imageId = parsePostId(req.params.imageId)
    if (!itemId || !imageId) {
      return res.status(400).json({ ok: false, error: 'invalid id' })
    }

    const image = await prisma.postItemImage.findUnique({
      where: { id: imageId },
      select: { id: true, postItemId: true, url: true },
    })

    if (!image || image.postItemId !== itemId) {
      return res.status(404).json({ ok: false, error: 'image not found' })
    }

    // Delete file from filesystem
    if (image.url.startsWith('/uploads/')) {
      const filename = image.url.substring('/uploads/'.length)
      const uploadsDir = path.join(__dirname, '..', 'uploads')
      const filepath = path.join(uploadsDir, filename)
      try {
        fs.unlinkSync(filepath)
      } catch (e) {
        // File may already be deleted, continue
        console.warn(`Could not delete file: ${filepath}`)
      }
    }

    await prisma.postItemImage.delete({ where: { id: imageId } })

    const updatedItem = await prisma.postItem.findUnique({
      where: { id: itemId },
      include: { images: { orderBy: { createdAt: 'asc' } } },
    })

    return res.json({ ok: true, item: updatedItem })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, error: 'item image delete failed' })
  }
})

// PUT /api/posts/:id — update title/description
app.put('/api/posts/:id', validateOriginHeader, requireAdminAuth, async (req, res) => {
  try {
    const id = parsePostId(req.params.id)
    if (!id) {
      return res.status(400).json({ ok: false, error: 'invalid post id' })
    }

    const validated = validatePostPayload(req.body.title, req.body.description)
    if ('error' in validated) {
      return res.status(400).json({ ok: false, error: validated.error })
    }

    const itemDrafts = typeof req.body?.items === 'undefined' ? null : parseItemUpdateDrafts(req.body.items)
    if (typeof req.body?.items !== 'undefined' && !itemDrafts) {
      return res.status(400).json({ ok: false, error: 'invalid items payload' })
    }

    let post
    if (itemDrafts) {
      const existingItems = await prisma.postItem.findMany({
        where: { postId: id },
        select: { id: true },
      })

      const existingIds = existingItems.map((item: { id: number }) => item.id).sort((a: number, b: number) => a - b)
      const draftIds = itemDrafts.map((item) => item.id).sort((a: number, b: number) => a - b)

      if (existingIds.length !== draftIds.length || existingIds.some((itemId: number, index: number) => itemId !== draftIds[index])) {
        return res.status(400).json({ ok: false, error: 'items must match existing article ids' })
      }

      post = await prisma.$transaction(async (tx) => {
        await tx.post.update({
          where: { id },
          data: { title: validated.title, description: validated.description },
        })

        for (const draft of itemDrafts) {
          await tx.postItem.update({
            where: { id: draft.id },
            data: {
              title: draft.title,
              description: draft.description,
              ebayUrl: draft.ebayUrl,
            },
          })
        }

        return tx.post.findUnique({
          where: { id },
          include: postInclude,
        })
      })
    } else {
      post = await prisma.post.update({
        where: { id },
        data: { title: validated.title, description: validated.description },
        include: postInclude,
      })
    }

    if (!post) {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }
    res.json({ ok: true, post })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }
    logger.error('Update post failed', err instanceof Error ? err : { message: String(err) })
    res.status(500).json({ ok: false, error: 'update failed' })
  }
})

// DELETE /api/posts/:id — delete post
app.delete('/api/posts/:id', validateOriginHeader, requireAdminAuth, async (req, res) => {
  try {
    const id = parsePostId(req.params.id)
    if (!id) {
      return res.status(400).json({ ok: false, error: 'invalid post id' })
    }

    // Fetch post with all images and items to clean up files
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        images: true,
        items: {
          include: { images: true }
        }
      }
    })

    if (!post) {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }

    // Delete all associated files from filesystem
    const filesToDelete: string[] = []
    
    // Post images
    for (const image of post.images) {
      if (image.url.startsWith('/uploads/')) {
        const filename = image.url.substring('/uploads/'.length)
        filesToDelete.push(filename)
      }
    }
    
    // Item images
    for (const item of post.items) {
      for (const image of item.images) {
        if (image.url.startsWith('/uploads/')) {
          const filename = image.url.substring('/uploads/'.length)
          filesToDelete.push(filename)
        }
      }
    }

    // Delete all files from disk
    const uploadsDir = path.join(__dirname, '..', 'uploads')
    for (const filename of filesToDelete) {
      const filepath = path.join(uploadsDir, filename)
      try {
        fs.unlinkSync(filepath)
      } catch (e) {
        // File may already be deleted, continue
        console.warn(`Could not delete file: ${filepath}`)
      }
    }

    // Delete post from database (cascade will handle items and images)
    await prisma.post.delete({
      where: { id },
    })
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'post not found' })
    }
    logger.error('Delete post failed', err instanceof Error ? err : { message: String(err) })
    res.status(500).json({ ok: false, error: 'delete failed' })
  }
})

// Error handler for Multer-specific errors and known error types
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  }

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

  // Pass to global error handler
  next(err)
})

// Global error handler - MUST be last (catches all unhandled errors)
// Prevents stack trace leakage to clients
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log full error details for debugging (visible in server logs only)
  logger.error('Unhandled error', err instanceof Error ? err : { message: String(err) })

  // Don't expose stack traces or internal details to client
  if (res.headersSent) {
    return _next(err)
  }

  // Send safe error response
  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500
  const safeMessage = statusCode === 500 ? 'Internal server error' : 'An error occurred'

  res.status(statusCode).json({
    ok: false,
    error: safeMessage,
  })
})

// Serve uploaded files in dev from backend/uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    index: false,
    maxAge: '7d',
  })
)

const server = app.listen(port, () => {
  logger.info(`Backend running on http://localhost:${port}`, {
    port,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

const shutdown = async () => {
  logger.info('Shutdown signal received, closing gracefully...')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
