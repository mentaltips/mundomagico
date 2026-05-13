import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getApiAuth } from '../../../lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getApiAuth(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (err) {
      // Ignore if directory already exists
    }

    // Create a unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const path = join(uploadDir, filename)
    
    await writeFile(path, buffer)
    
    const url = `/uploads/${filename}`
    
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[UPLOAD_ERROR]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
