'use client'

import { Printer, X } from 'lucide-react'
import { StaffPayment, MONTHS, ROLE_LABELS } from './types'

type Props = {
  payment: StaffPayment
  onClose: () => void
}

export function ModalPayslip({ payment, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl rounded-[2rem] bg-card p-6 shadow-2xl border border-border my-8">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4 print:hidden">
          <span className="text-sm font-bold text-muted-foreground">Recibo de Pagamento (Holerite)</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-accent px-3 py-1.5 text-xs font-black transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / PDF
            </button>

            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* HOLERITE CONTENT (HTML PRINTABLE FORMAT) */}
        <div className="border-4 border-double border-gray-300 dark:border-gray-800 p-6 bg-white text-gray-900 font-sans print:border-black rounded-2xl print:rounded-none">

          {/* Header Box */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-gray-300 print:border-black">
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">MUNDO MÁGICO</h1>
              <p className="text-xs text-gray-500 font-bold">Escola de Educação Infantil e Recreação</p>
              <p className="text-[10px] text-gray-400">CNPJ: 00.000.000/0001-00</p>
            </div>

            <div className="text-right border-l-2 border-gray-200 pl-4">
              <h2 className="text-sm font-black uppercase text-gray-700">Recibo de Pagamento</h2>
              <p className="text-2xl font-black text-indigo-600 mt-1">R$ {payment.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{MONTHS[payment.referenceMonth - 1]} / {payment.referenceYear}</p>
            </div>
          </div>

          {/* Employee Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b-2 border-gray-300 print:border-black bg-gray-50/50 p-3.5 rounded-xl my-4">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Colaborador(a)</p>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{payment.staff.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CPF</p>
              <p className="font-bold text-gray-900 mt-0.5">{payment.staff.pixKey?.length === 11 ? payment.staff.pixKey : 'Não cadastrado'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Função / Cargo</p>
              <p className="font-bold text-gray-900 mt-0.5">{ROLE_LABELS[payment.staff.roleType] || payment.staff.roleType}</p>
            </div>
          </div>

          {/* Table of Earnings & Deductions */}
          <div className="border border-gray-300 rounded-xl overflow-hidden my-4 text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-center w-12">Cód</th>
                  <th className="px-4 py-2">Descrição da Rubrica</th>
                  <th className="px-4 py-2 text-center w-16">Ref</th>
                  <th className="px-4 py-2 text-right w-28">Vencimentos</th>
                  <th className="px-4 py-2 text-right w-28">Descontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Salário Base */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-center text-gray-400">100</td>
                  <td className="px-4 py-2 font-bold">Salário Contratual Base</td>
                  <td className="px-4 py-2 text-center">30 D</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-900">R$ {payment.baseSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-400">-</td>
                </tr>

                {/* Bonuses */}
                {payment.bonuses.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-gray-400">{200 + idx}</td>
                    <td className="px-4 py-2 font-bold">{b.title} <span className="text-[10px] text-gray-400 font-normal">({b.description || 'Bônus lançado'})</span></td>
                    <td className="px-4 py-2 text-center">-</td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-400">-</td>
                  </tr>
                ))}

                {/* Deductions */}
                {payment.deductions.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-gray-400">{300 + idx}</td>
                    <td className="px-4 py-2 font-bold">{d.title} <span className="text-[10px] text-gray-400 font-normal">({d.description || 'Desconto lançado'})</span></td>
                    <td className="px-4 py-2 text-center">-</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-400">-</td>
                    <td className="px-4 py-2 text-right font-mono text-rose-600">R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-3 border-t-2 border-gray-300 pt-4 text-xs font-bold text-gray-700">
            <div>
              <p>Total de Vencimentos</p>
              <p className="text-sm text-gray-900 mt-0.5">R$ {(payment.baseSalary + payment.totalBonuses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p>Total de Descontos</p>
              <p className="text-sm text-gray-900 mt-0.5">R$ {payment.totalDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p>Valor Líquido a Receber</p>
              <p className="text-base text-indigo-600 font-black mt-0.5">R$ {payment.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Payment Confirmation Area */}
          <div className="mt-8 pt-6 border-t border-dashed border-gray-300 grid grid-cols-2 gap-4 text-[10px] text-gray-500">
            <div>
              <p className="uppercase tracking-wider font-bold">Confirmação de Transação Bancária</p>
              <p className="mt-1 font-semibold text-gray-700">
                {payment.status === 'PAID' ? (
                  `Liquidado via ${payment.paymentMethod} em ${new Date(payment.paymentDate!).toLocaleDateString('pt-BR')}`
                ) : (
                  'Pendente de Processamento Financeiro'
                )}
              </p>
              {payment.staff.pixKey && <p className="mt-0.5">Chave PIX Favorecido: {payment.staff.pixKey}</p>}
            </div>

            <div className="text-center border-l border-gray-200 flex flex-col justify-end items-center h-16 pt-4">
              <div className="w-48 border-b border-gray-400"></div>
              <p className="mt-1 font-bold">Assinatura do Favorecido / Recibo</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
