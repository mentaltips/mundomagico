'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area 
} from 'recharts'
import { 
  TrendingUp, Users, MousePointer2, Clock, 
  BarChart3, ShieldCheck, Globe 
} from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type AnalyticsData = {
  totalVisits: number
  topPaths: { path: string; count: number }[]
  recentVisits: any[]
  chartData: { day: string; visits: number }[]
}

export default function AnalyticsClient() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => fetch('/api/analytics').then(r => r.json())
  })

  if (isLoading) return <div className="p-10 animate-pulse text-center">Carregando métricas...</div>

  const stats = [
    { label: 'Total de Acessos', value: data?.totalVisits || 0, icon: <MousePointer2 />, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Visitas Recentes', value: data?.recentVisits?.length || 0, icon: <Clock />, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Páginas Ativas', value: data?.topPaths?.length || 0, icon: <Globe />, color: 'text-purple-500 bg-purple-500/10' },
  ]

  return (
    <div className="page animate-in fade-in duration-700">
      <PageHeader 
        title="Contador de Acessos" 
        subtitle="Monitore o tráfego e o engajamento dos pais e colaboradores em tempo real."
        icon={<BarChart3 size={24} />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex items-center gap-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <h3 className="text-3xl font-black text-foreground">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-lg text-foreground flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Fluxo de Acessos (7 dias)
            </h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorVisits)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Pages List */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
          <h4 className="font-black text-lg text-foreground mb-6">Páginas mais Vistas</h4>
          <div className="space-y-4">
            {data?.topPaths.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 border border-border">
                <code className="text-xs font-bold text-primary truncate max-w-[150px]">{p.path}</code>
                <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {p.count}
                </span>
              </div>
            ))}
            {(!data?.topPaths || data.topPaths.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-10">Aguardando primeiros acessos...</p>
            )}
          </div>
        </div>
      </div>

      {/* LGPD Compliance Note */}
      <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="font-black text-emerald-900 text-sm uppercase tracking-widest">Conformidade LGPD Ativa</h4>
          <p className="text-xs text-emerald-700/80 font-medium">Os dados de acesso são anonimizados e não identificam o usuário pessoalmente, respeitando a privacidade dos pais.</p>
        </div>
      </div>
    </div>
  )
}
