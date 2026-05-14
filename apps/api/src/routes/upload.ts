import { Router, Request, Response, NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const router = Router()

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const name = crypto.randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(new Error('Apenas imagens JPEG, PNG e WebP são permitidas'))
  },
})

// POST /upload/image
router.post('/image', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Imagem muito grande. Máximo 5MB.' })
      }
      return res.status(400).json({ error: err.message })
    }
    if (err) {
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const baseUrl = (process.env.API_BASE_URL || `http://localhost:${process.env.API_PORT || 3002}`).replace(/\/$/, '')
    const url = `${baseUrl}/uploads/${req.file.filename}`

    res.json({ url, filename: req.file.filename })
  })
})

// DELETE /upload/image/:filename
router.delete('/image/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename)
  const filepath = path.join(UPLOAD_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' })
  }

  fs.unlinkSync(filepath)
  res.json({ success: true })
})

export default router
