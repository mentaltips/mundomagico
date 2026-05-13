'use client'

import { FileText, Download, Loader2, File } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Document = {
  id: string
  name: string
  docType: string
  url: string
  uploadedAt: string
}

type Child = {
  id: string
  fullName: string
  documents: Document[]
}

const DOC_TYPE_LABELS: Record<string, string> = {
  RG:              'RG',
  CPF:             'CPF',
  CERTIDAO:        'Certidão de Nascimento',
  CARTEIRA_VACINA: 'Carteira de Vacinação',
  LAUDO_MEDICO:    'Laudo Médico',
  CONTRATO:        'Contrato',
  AUTORIZAÇÃO:     'Autorização',
  OUTRO:           'Outro',
}

export default function GuardianDocumentsPage() {
  const { data: session } = useSession()

  const { data: dashboard } = useQuery({
    queryKey: ['guardian-dashboard'],
    queryFn: () => fetch('/api/parent/dashboard').then((r) => r.json()),
    enabled: !!session,
  })

  const childId = dashboard?.child?.id

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['guardian-documents', childId],
    queryFn: () => fetch(`/api/children/${childId}/documents`).then((r) => r.json()),
    enabled: !!childId,
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <FileText className="text-sky-500" size={24} />
          Documentos
        </h1>
        <p className="text-sm text-gray-500 mt-1">Documentos da criança armazenados pela escola</p>
      </div>

      {isLoading || !childId ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-sky-500 animate-spin" size={32} />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Nenhum documento cadastrado</p>
          <p className="text-xs text-gray-400 mt-1">Entre em contato com a escola para enviar documentos</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/50">
            <p className="font-black text-gray-700">{documents.length} documento{documents.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center shrink-0">
                  <File size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                    {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">
                    Enviado em {format(new Date(doc.uploadedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-sky-50 text-sky-600 rounded-2xl hover:bg-sky-100 transition-colors shrink-0"
                  title="Baixar documento"
                >
                  <Download size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
