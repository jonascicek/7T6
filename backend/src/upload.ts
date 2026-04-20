import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

export const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (_req, file, cb) {
    const safeOriginal = path.basename(file.originalname)
    const ext = path.extname(safeOriginal).toLowerCase() || '.img'
    const base = path.basename(safeOriginal, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
    const name = `${Date.now()}-${base}${ext}`
    cb(null, name)
  },
})

const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 40,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error('INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})
