'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ImageUpload({ value, onChange, label = 'Foto', size = 'md' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  const dimensions = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' }[size]

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    // Preview local imediato
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
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
    <div className="flex flex-col items-start gap-3">
      {label && <label className="label">{label}</label>}

      <div className="flex items-end gap-4">
        {/* Área de preview / drop */}
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
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight px-1">
                Clique ou arraste
              </span>
            </div>
          )}
        </div>

        {/* Botões laterais */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-xs py-2 px-3 gap-1.5"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Enviando...' : 'Escolher foto'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-ghost text-xs py-2 px-3 gap-1.5 text-rose-500 hover:bg-rose-500/10"
            >
              <X size={14} /> Remover
            </button>
          )}
        </div>
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
