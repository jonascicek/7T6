import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { uploadMiddleware } from './upload'
import path from 'path'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// POST /api/posts — erstelle neuen Post mit Bildern
app.post('/api/posts', uploadMiddleware.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    const { title, description } = req.body

    if (!title || !description) {
      return res.status(400).json({ ok: false, error: 'title und description erforderlich' })
    }

    // Speichere Post + Images in DB
    const post = await prisma.post.create({
      data: {
        title,
        description,
        images: {
          create: files.map((f) => ({
            url: '/uploads/' + f.filename,
          })),
        },
      },
      include: { images: true },
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
      include: { images: true },
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
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
      include: { images: true },
    })
    if (!post) return res.status(404).json({ ok: false, error: 'post not found' })
    res.json({ ok: true, post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'fetch failed' })
  }
})

// PUT /api/posts/:id — update title/description
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, description } = req.body
    if (!title || !description) {
      return res.status(400).json({ ok: false, error: 'title und description erforderlich' })
    }
    const post = await prisma.post.update({
      where: { id: Number(req.params.id) },
      data: { title, description },
      include: { images: true },
    })
    res.json({ ok: true, post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'update failed' })
  }
})

// DELETE /api/posts/:id — delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    await prisma.post.delete({
      where: { id: Number(req.params.id) },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: 'delete failed' })
  }
})

// Serve uploaded files in dev from backend/uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const port = Number(process.env.PORT || 4000)
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`))
