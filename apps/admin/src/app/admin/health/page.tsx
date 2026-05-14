'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Pill, AlertCircle, Clock, 
  CheckCircle2, Plus, Search, Filter,
  Stethoscope, Thermometer, User, ClipboardList,
  ChevronRight, X, AlertTriangle
} from 'lucide-react'
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
        toast.success(`Medicamento administrado com sucesso para ${selectedMed.child.nickname || selectedMed.child.fullName}! ✅`)
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
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Heart className="text-rose-500 fill-rose-500" size={32} />
            Saúde & <span className="text-primary">Bem-estar</span>
          </h1>
          <p className="page-subtitle">Controle de medicações, alergias e cuidados especiais.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por aluno ou remédio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-12 rounded-[2rem]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Quick Stats & Alertas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-8 rounded-[3rem] relative overflow-hidden bg-gradient-to-br from-card to-accent/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
            <h3 className="label mb-6">Medicações de Hoje</h3>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-primary">{Array.isArray(medications) ? medications.length : 0}</span>
              <span className="text-muted-foreground font-bold mb-2 uppercase text-[10px]">Ativas</span>
            </div>
          </div>

          <div className="bg-amber-500/10 p-8 rounded-[3rem] border border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <AlertTriangle className="text-amber-500 opacity-20" size={48} />
            </div>
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4">Atenção!</h3>
            <p className="text-sm text-amber-500/80 font-medium leading-relaxed">
              Sempre confira a dosagem e autorização dos pais antes de administrar qualquer medicamento.
            </p>
          </div>
        </div>

        {/* Right Column: Active Medications List */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredMeds.length === 0 ? (
            <div className="card p-20 rounded-[3rem] border-2 border-dashed border-border text-center">
              <Pill className="text-muted/20 mx-auto mb-4" size={48} />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Nenhuma medicação ativa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMeds.map((med, i) => (
                <motion.div 
                  key={med.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-6 rounded-[2.5rem] hover:shadow-xl hover:border-primary/20 transition-all group bg-card"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {med.child?.photoUrl ? (
                        <img src={med.child.photoUrl} className="w-14 h-14 rounded-2xl object-cover border border-border" alt="" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                          {med.child?.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center shadow-sm border border-border">
                        <Pill className="text-rose-500" size={14} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-foreground leading-tight">{med.child?.fullName}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{med.child?.group?.name || 'Sem turma'}</p>
                    </div>
                  </div>

                  <div className="bg-accent/40 rounded-3xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Medicamento</span>
                      <span className="badge-red">{med.frequency}</span>
                    </div>
                    <p className="text-lg font-black text-foreground">{med.name}</p>
                    <p className="text-sm font-bold text-muted-foreground mt-1 flex items-center gap-2">
                      <Thermometer size={14} className="text-primary" />
                      Dosagem: <span className="text-foreground">{med.dosage}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Última Dose</span>
                      <span className="text-xs font-bold text-foreground/80">
                        {med.administrations?.[0] 
                          ? new Date(med.administrations[0].administeredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : 'Ainda não dada'}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedMed(med)
                        setShowModal(true)
                      }}
                      className="btn-primary px-6 py-3 rounded-2xl text-xs flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Dar Dose
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Medication Administration */}
      <AnimatePresence>
        {showModal && selectedMed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-border"
            >
              <div className="p-8 bg-accent/20 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                    <Pill size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Registrar Dose</h2>
                    <p className="label">{selectedMed.child?.nickname || selectedMed.child?.fullName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-card rounded-full text-muted-foreground hover:text-foreground transition-colors shadow-sm border border-border"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdminister} className="p-8 space-y-6">
                <div className="bg-blue-500/10 p-6 rounded-[2rem] border border-blue-500/20 flex items-start gap-4">
                  <AlertCircle className="text-blue-500 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Prescrição Original</p>
                    <p className="text-sm font-bold text-blue-500/80 leading-relaxed">
                      {selectedMed.name} - {selectedMed.dosage} ({selectedMed.frequency})
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="label ml-2">Confirmar Dosagem</label>
                  <input 
                    type="text" 
                    placeholder={selectedMed.dosage}
                    value={adminData.dosage}
                    onChange={e => setAdminData({...adminData, dosage: e.target.value})}
                    className="input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="label ml-2">Observações / Reações</label>
                  <textarea 
                    rows={3}
                    placeholder="Alguma observação sobre a administração..."
                    value={adminData.notes}
                    onChange={e => setAdminData({...adminData, notes: e.target.value})}
                    className="input"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={18} />
                    Confirmar e Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
