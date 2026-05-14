'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Pill, AlertCircle, Clock, 
  CheckCircle2, Plus, Search, Filter,
  Stethoscope, Thermometer, User, ClipboardList,
  ChevronRight, X, AlertTriangle, Loader2
} from 'lucide-react'
import { Modal, PageHeader, EmptyState, Badge, LoadingState, StatCard, Avatar } from '@/components/ui'
import toast from 'react-hot-toast'

export default function HealthPage() {
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMed, setSelectedMed] = useState<any>(null)
  
  // Administration form state
  const [adminData, setAdminData] = useState({
    dosage: '',
    notes: ''
  })

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setMedications(data)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados de saúde')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
  }, [])

  const handleAdminister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMed) return

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId: selectedMed.id,
          dosage: adminData.dosage || selectedMed.dosage,
          notes: adminData.notes
        })
      })

      if (res.ok) {
        toast.success(`Medicamento registrado! ✅`)
        setShowModal(false)
        setAdminData({ dosage: '', notes: '' })
        fetchHealthData()
      }
    } catch (error) {
      toast.error('Erro ao registrar administração')
    }
  }

  const filteredMeds = Array.isArray(medications) ? medications.filter(med => 
    med.child?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    med.name?.toLowerCase().includes(search.toLowerCase())
  ) : []

  return (
    <div className="page animate-in">
      <PageHeader 
        title="Saúde & Bem-estar" 
        subtitle="Controle de medicações, alergias e cuidados especiais."
        icon={<Heart className="text-rose-500 fill-rose-500" size={24} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Quick Stats & Alertas */}
        <div className="lg:col-span-1 space-y-4">
          <StatCard 
            label="Medicações Hoje" 
            value={Array.isArray(medications) ? medications.length.toString() : '0'} 
            icon={<Pill size={20} />} 
            color="text-primary bg-primary/10" 
            trend="Ativas no momento"
          />

          <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <AlertTriangle className="text-amber-500 opacity-20" size={40} />
            </div>
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Atenção!</h3>
            <p className="text-xs text-amber-500/80 font-bold leading-relaxed">
              Sempre confira a dosagem e autorização dos pais antes de administrar qualquer medicamento.
            </p>
          </div>
        </div>

        {/* Right Column: Active Medications List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por aluno ou remédio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {loading ? (
            <LoadingState label="Carregando medicações..." />
          ) : filteredMeds.length === 0 ? (
            <EmptyState 
              icon={<Pill size={32} />}
              title="Nenhuma medicação ativa"
              description="Nenhum medicamento pendente de administração no momento."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMeds.map((med, i) => (
                <motion.div 
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hover p-6 flex flex-col group"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar name={med.child?.fullName} photoUrl={med.child?.photoUrl} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-black text-foreground leading-tight truncate">{med.child?.fullName}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{med.child?.group?.name || 'Sem turma'}</p>
                    </div>
                  </div>

                  <div className="bg-accent/40 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Medicamento</span>
                      <Badge label={med.frequency} variant="amber" size="sm" />
                    </div>
                    <p className="text-lg font-black text-foreground">{med.name}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">
                      <Thermometer size={14} className="text-primary" />
                      Dosagem: <span className="text-foreground">{med.dosage}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Última Dose</span>
                      <span className="text-[11px] font-black text-foreground/80">
                        {med.administrations?.[0] 
                          ? new Date(med.administrations[0].administeredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : 'Pendente'}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedMed(med)
                        setShowModal(true)
                      }}
                      className="btn-primary py-2 px-5 rounded-xl text-[11px] flex items-center gap-2"
                    >
                      <Plus size={14} /> Registrar Dose
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Administrar Dose */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title="Registrar Dose"
        subtitle={selectedMed?.child?.fullName || 'Saúde'}
      >
        <form onSubmit={handleAdminister} className="space-y-5">
          <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 flex items-start gap-4">
            <AlertCircle className="text-primary shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Prescrição Original</p>
              <p className="text-sm font-bold text-primary/80 leading-relaxed">
                {selectedMed?.name} - {selectedMed?.dosage} ({selectedMed?.frequency})
              </p>
            </div>
          </div>

          <div>
            <label className="label">Confirmar Dosagem *</label>
            <input 
              type="text" 
              placeholder={selectedMed?.dosage}
              value={adminData.dosage}
              onChange={e => setAdminData({...adminData, dosage: e.target.value})}
              className="input"
            />
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea 
              rows={3}
              placeholder="Ex: Tomou tudo sem dificuldades..."
              value={adminData.notes}
              onChange={e => setAdminData({...adminData, notes: e.target.value})}
              className="input"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
            <button 
              type="submit"
              className="btn-primary flex-1 gap-2"
            >
              <CheckCircle2 size={18} /> Confirmar Dose
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
