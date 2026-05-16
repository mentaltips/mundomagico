'use client'

import { useState } from 'react'
import { Camera, X, Loader2, Share2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getSafeUrl } from '@/lib/utils'

type Photo = {
  id: string
  url: string
  caption: string | null
  date: string
  child: { fullName: string } | null
}

export default function GuardianPhotosPage() {
  const [preview, setPreview] = useState<Photo | null>(null)

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['guardian-photos'],
    queryFn: () => fetch('/api/photos?sharedWithParents=true').then((r) => r.json()),
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Camera className="text-sky-500" size={24} />
          Galeria de Fotos
        </h1>
        <p className="text-sm text-gray-500 mt-1">Momentos especiais do dia a dia da escola</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-sky-500 animate-spin" size={32} />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <Camera className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Nenhuma foto compartilhada ainda</p>
          <p className="text-xs text-gray-400 mt-1">A equipe da escola irá compartilhar fotos em breve</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-bold">{photos.length} foto{photos.length !== 1 ? 's' : ''} compartilhada{photos.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-2xl overflow-hidden aspect-square bg-gray-100"
                onClick={() => setPreview(photo)}
              >
                <img
                  src={getSafeUrl(photo.url)}
                  alt={photo.caption ?? 'Foto'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Foto' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  {photo.caption && <p className="text-white text-xs font-bold truncate">{photo.caption}</p>}
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500/80 rounded-full flex items-center justify-center">
                  <Share2 size={11} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
          >
            <X size={24} />
          </button>
          <div className="max-w-lg w-full">
            <img
              src={getSafeUrl(preview.url)}
              alt={preview.caption ?? 'Foto'}
              className="w-full rounded-3xl max-h-[70vh] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Foto' }}
            />
            {(preview.caption || preview.child || preview.date) && (
              <div className="mt-4 text-center text-white">
                {preview.caption && <p className="font-black text-lg">{preview.caption}</p>}
                {preview.child && <p className="text-white/70 text-sm mt-1">{preview.child.fullName}</p>}
                <p className="text-white/50 text-xs mt-1">
                  {format(new Date(preview.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
