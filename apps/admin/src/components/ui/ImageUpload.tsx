'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

import { getSafeUrl } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ImageUpload({ value, onChange, label = 'Foto', size = 'md' }: ImageUploadProps) {
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const safeValue = getSafeUrl(value) || null
  const [preview, setPreview] = useState<string | null>(safeValue)

  const dimensions = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' }[size]

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
      const token = (session as any)?.accessToken
      const res = await fetch(`${apiUrl}/upload/image`, { 
        method: 'POST', 
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro no upload')

      onChange(data.url)
      toast.success('Foto enviada!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto')
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {label && <label className="label">{label}</label>}

      {/* Área única: clique + drag-and-drop + preview */}
      <div
        className={`relative ${dimensions} rounded-2xl border-2 border-dashed border-border bg-accent/30 flex items-center justify-center cursor-pointer overflow-hidden group transition-all hover:border-primary/50 hover:bg-primary/5`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-primary" />
        ) : preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            {/* Hover: câmera + remover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Camera size={20} className="text-white" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-rose-400 transition-colors"
              >
                Remover
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground px-2">
            <Upload size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
              Clique ou arraste
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground font-medium">
        JPEG, PNG ou WebP · Máx. 5MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
