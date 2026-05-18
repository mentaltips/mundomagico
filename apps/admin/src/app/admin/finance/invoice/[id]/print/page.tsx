'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Printer } from 'lucide-react'

export default function PrintInvoicePage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/finance/invoices/${id}`)
      .then(res => res.json())
      .then(data => {
        setInvoice(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  )

  if (!invoice) return <div className="p-10 text-center">Fatura não encontrada.</div>

  const school = invoice.school || {}
  const child = invoice.child || invoice.student || {}
  const guardian = invoice.guardian || (child.guardians?.[0]) || {}

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="min-h-screen bg-white p-4 sm:p-10 font-sans text-black">
      {/* Botão de Impressão (esconde na hora de imprimir) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-end print:hidden">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:opacity-80 transition-all"
        >
          <Printer size={20} /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto border-2 border-black p-6 space-y-8 bg-white shadow-sm">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tighter">{school.name || 'Mundo Mágico'}</h1>
            <p className="text-xs font-bold text-gray-600">{school.address || 'Endereço da Escola'}</p>
            <p className="text-xs font-bold text-gray-600">CNPJ: {school.cnpj || '00.000.000/0000-00'} | Tel: {school.phone || '(00) 0000-0000'}</p>
          </div>
          <div className="text-right">
            <div className="bg-black text-white px-4 py-2 font-black text-sm uppercase">Recibo de Pagamento</div>
            <p className="text-[10px] font-bold mt-2 text-gray-400">ID: {invoice.id}</p>
          </div>
        </div>

        {/* Corpo do Recibo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Responsável (Pagador)</label>
              <p className="font-bold text-lg">{guardian.fullName || 'Responsável não informado'}</p>
              <p className="text-sm text-gray-600">{guardian.email || ''}</p>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Referente ao Aluno</label>
              <p className="font-bold">{child.fullName || 'Aluno não informado'}</p>
            </div>

            {/* PIX AREA */}
            {(invoice.pixQrCode || invoice.pixCopyPaste) && (
              <div className="pt-4 border-t border-gray-100 flex gap-4 items-center">
                {invoice.pixQrCode && (
                  <div className="bg-white p-2 border border-gray-200 rounded-xl">
                    <NextImage
                      src={`data:image/png;base64,${invoice.pixQrCode}`} 
                      alt="PIX QR Code" 
                      width={96}
                      height={96}
                      unoptimized
                      className="w-24 h-24"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Pague com PIX
                  </label>
                  <p className="text-[10px] text-gray-500 leading-tight break-all font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {invoice.pixCopyPaste}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vencimento</label>
              <p className="font-black text-xl">{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Total</label>
              <p className="font-black text-3xl text-primary">{fmtBRL(invoice.amount)}</p>
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="border-2 border-black p-4 bg-gray-50">
          <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Descrição dos Serviços</label>
          <p className="font-bold text-sm leading-relaxed whitespace-pre-wrap">{invoice.description}</p>
          {invoice.referenceMonth && (
            <p className="text-xs font-bold mt-2 text-gray-500">Mês de Referência: {invoice.referenceMonth}</p>
          )}
        </div>

        {/* Canhoto / Rodapé estilo Boleto */}
        <div className="pt-8 space-y-6 border-t-2 border-dashed border-gray-300 mt-12">
          {/* Linha Digitável / Código de Barras Visual */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Código de Barras / Linha Digitável</label>
              <p className="font-mono text-xs font-bold">{invoice.boletoBarcode || '00090.00000 00000.000000 00000.000000 0 00000000000000'}</p>
            </div>
            <div className="h-16 w-full bg-black flex items-center justify-center overflow-hidden">
               {/* Simulação de Código de Barras com CSS */}
               <div className="flex gap-[1px] h-full w-full bg-white px-4">
                  {Array.from({ length: 120 }).map((_, i) => (
                    <div key={i} className="bg-black h-full" style={{ width: `${Math.random() > 0.5 ? 2 : 4}px` }} />
                  ))}
               </div>
            </div>
          </div>

          <div className="flex justify-between items-end pt-4">
            <div className="space-y-4">
              <p className="text-[10px] italic text-gray-400 max-w-sm">
                Este documento é um recibo de cobrança emitido pelo sistema de gestão Mundo Mágico. 
                O pagamento pode ser efetuado via PIX, Cartão ou diretamente na secretaria da escola.
              </p>
              <div className="w-64 h-12 border-b border-black"></div>
              <p className="text-[10px] font-black uppercase">Assinatura / Carimbo da Escola</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-gray-400">DATA DE EMISSÃO</p>
              <p className="font-black">{format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .page { padding: 0 !important; }
          @page { margin: 0.5cm; }
        }
      `}</style>
    </div>
  )
}
