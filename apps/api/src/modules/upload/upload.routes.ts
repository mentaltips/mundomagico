import { Router, Request, Response, NextFunction } from 'express'
import multer, { MulterError } from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'

const router = Router()

router.use(requirePermission('canManageStudents'))

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const safeFilenamePattern = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i

function detectImageExtension(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg'
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return '.png'
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return '.webp'
  }

  return null
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true)
    cb(new Error('Apenas imagens JPEG, PNG e WebP sao permitidas'))
  },
})

// POST /upload/image
router.post('/image', (req: Request, res: Response, _next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Imagem muito grande. Maximo 5MB.' })
      }
      return res.status(400).json({ error: err.message })
    }

    if (err) {
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    const ext = detectImageExtension(req.file.buffer)
    if (!ext) {
      return res.status(400).json({ error: 'Arquivo de imagem invalido' })
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filepath, req.file.buffer, { flag: 'wx' })

    const host = req.get('host') || 'localhost:3002'
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'
    const baseUrl = `${protocol}://${host}`
    const url = `${baseUrl}/uploads/${filename}`
    const proxyUrl = `/api/uploads/${filename}`

    res.json({ url, proxyUrl, filename })
  })
})

// DELETE /upload/image/:filename
router.delete('/image/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename)
  if (!safeFilenamePattern.test(filename)) {
    return res.status(400).json({ error: 'Nome de arquivo invalido' })
  }

  const filepath = path.join(UPLOAD_DIR, filename)
  const resolvedPath = path.resolve(filepath)
  const resolvedUploadDir = path.resolve(UPLOAD_DIR)

  if (!resolvedPath.startsWith(`${resolvedUploadDir}${path.sep}`)) {
    return res.status(400).json({ error: 'Caminho de arquivo invalido' })
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Arquivo nao encontrado' })
  }

  fs.unlinkSync(filepath)
  res.json({ success: true })
})

export default router
