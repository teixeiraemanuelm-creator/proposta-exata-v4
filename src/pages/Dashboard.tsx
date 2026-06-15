import { useEffect, useState } from 'react'
import { TrendingUp, Clock, CheckCircle, FileText, Plus, ArrowRight, Users, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts'
import { getOrcamentos, getClientes, getRecibos } from '@/lib/supabase'
import { R$, fmtData, gerarRelatorioPDF } from '@/lib/utils'
import { Badge, Btn, Spinner } from '@/components/ui'
import { Logo } from '@/components/Logo'
import type { Screen } from '@/types'

const PERIODS = [
  { id: 'today', label: 'Hoje', days: 0 },
  { id: '7d', label: '7 dias', days: 7 },
  { id: 'month', label: 'Este Mês', days: 30 },
  { id: 'all', label: 'Ano Todo', days: 365 },
]

const MODULES: { screen: Screen; label: string; color: string; emoji: string }[] = [
  { screen: 'orcamentos', label: 'Orçamentos', color: 'from-blue-600/40 to-blue-800/40 border-blue-500/20', emoji: '📄' },
  { screen: 'recibos', label: 'Recibos', color: 'from-purple-600/40 to-purple-800/40 border-purple-500/20', emoji: '🧾' },
  { screen: 'clientes', label: 'Clientes', color: 'from-cyan-600/40 to-cyan-800/40 border-cyan-500/20', emoji: '👥' },
  { screen: 'produtos', label: 'Produtos', color: 'from-pink-600/40 to-pink-800/40 border-pink-500/20', emoji: '📦' },
  { screen: 'relatorios', label: 'Relatórios', color: 'from-indigo-600/40 to-indigo-800/40 border-indigo-500/20', emoji: '📊' },
  { screen: 'equipe', label: 'Equipe', color: 'from-amber-600/40 to-amber-800/40 border-amber-500/20', emoji: '💛' },
  { screen: 'estoque', label: 'Estoque', color: 'from-orange-600/40 to-orange-800/40 border-orange-500/20', emoji: '🏭' },
  { screen: 'configuracoes', label: 'Configurações', color: 'from-gray-600/40 to-gray-800/40 border-gray-500/20', emoji: '⚙️' },
]

interface Props { onNavigate: (s: Screen, id?: string) => void }

export function Dashboard({ onNavigate }: Props) {
  const { empresa } = useAuth()
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [today] = useState(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!empresa) return
    Promise.all([
      getOrcamentos(empresa.id),
      getClientes(empresa.id),
      getRecibos(empresa.id),
    ]).then(([o, c, r]) => {
      setOrcamentos(o.data ?? [])
      setClientes(c.data ?? [])
      setRecibos(r.data ?? [])
      setLoading(false)
    })
  }, [empresa])

  // Filter by period
  const filtered = orcamentos.filter(o => {
    const p = PERIODS.find(p => p.id === period)!
    if (p.days === 365) return new Date(o.created_at).getFullYear() === new Date().getFullYear()
    if (p.days === 0) return new Date(o.created_at).toDateString() === new Date().toDateString()
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - p.days)
    return new Date(o.created_at) >= cutoff
  })

  const aprovados = filtered.filter(o => o.status === 'aprovado')
  const pendentes = filtered.filter(o => o.status === 'enviado')
  const totalEmitido = filtered.reduce((s, o) => s + o.total, 0)
  const receitaAprovada = aprovados.reduce((s, o) => s + o.total, 0)
  const conversao = filtered.length > 0 ? Math.round((aprovados.length / filtered.length) * 100) : 0

  // Novos clientes no período
  const novosClientes = clientes.filter(c => {
    const p = PERIODS.find(p => p.id === period)!
    if (p.days === 365) return new Date(c.created_at).getFullYear() === new Date().getFullYear()
    if (p.days === 0) return new Date(c.created_at).toDateString() === new Date().toDateString()
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - p.days)
    return new Date(c.created_at) >= cutoff
  })

  // Receita de recibos no período
  const receitaRecibos = recibos.filter(r => {
    const p = PERIODS.find(p => p.id === period)!
    if (p.days === 365) return new Date(r.created_at).getFullYear() === new Date().getFullYear()
    if (p.days === 0) return new Date(r.created_at).toDateString() === new Date().toDateString()
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - p.days)
    return new Date(r.created_at) >= cutoff
  }).reduce((s, r) => s + (r.valor_total ?? r.total ?? 0), 0)

  // Chart data — receita aprovada últimos 30 dias
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const ds = d.toDateString()
    const receita = orcamentos
      .filter(o => new Date(o.created_at).toDateString() === ds && o.status === 'aprovado')
      .reduce((s, o) => s + o.total, 0)
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, receita }
  })
  const maxReceita = Math.max(...chartData.map(d => d.receita), 1)

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    const periodoLabel = PERIODS.find(p => p.id === period)?.label ?? period
    await gerarRelatorioPDF(empresa, filtered, periodoLabel, {
      receitaAprovada,
      totalEmitido,
      conversao,
      aprovados: aprovados.length,
      pendentes: pendentes.length,
      total: filtered.length,
    })
    setExporting(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <p className="text-xs text-gray-500 capitalize">{today}</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting} className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
          <ArrowRight size={12} /> {exporting ? 'Gerando...' : 'Exportar PDF'}
        </button>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Período:</span>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p.id ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Receita Aprovada', value: R$(receitaAprovada), sub: `${aprovados.length} fechados`, icon: <TrendingUp size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Propostas Pendentes', value: String(pendentes.length), sub: `de ${filtered.length} emitidas`, icon: <Clock size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Novos Clientes', value: String(novosClientes.length), sub: `${clientes.length} total`, icon: <Users size={18} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Recibos Emitidos', value: R$(receitaRecibos), sub: `${recibos.length} total`, icon: <Receipt size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center ${k.color} mb-3`}>{k.icon}</div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Conversão highlight */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle size={20} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Taxa de conversão no período</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${conversao}%` }} />
            </div>
            <span className="text-sm font-bold text-blue-400 tabular-nums">{conversao}%</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-white">{R$(totalEmitido)}</p>
          <p className="text-xs text-gray-600">total emitido</p>
        </div>
      </div>

      {/* Chart — receita aprovada 30 dias */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-1 text-sm">Receita Aprovada — últimos 30 dias</h2>
        <p className="text-xs text-gray-600 mb-4">Valor dos orçamentos aprovados por dia</p>
        <div className="flex items-end gap-0.5 h-20">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className="w-full bg-emerald-500/70 rounded-sm transition-all"
                style={{ height: `${(d.receita / maxReceita) * 64}px`, minHeight: d.receita > 0 ? '3px' : '1px' }}
              />
              {d.receita > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-600 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {d.label}: {R$(d.receita)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{chartData[0].label}</span>
          <span>{chartData[chartData.length - 1].label}</span>
        </div>
      </div>

      {/* Recentes */}
      {orcamentos.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h2 className="font-semibold text-white text-sm">Recentes</h2>
            <button onClick={() => onNavigate('orcamentos')} className="text-xs text-brand-500 hover:text-brand-400">Ver todos</button>
          </div>
          {orcamentos.slice(0, 3).map(o => (
            <button key={o.id} onClick={() => onNavigate('orcamento-detalhe', o.id)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors text-left border-b border-white/4 last:border-0">
              <span className="text-xs text-gray-600 w-12">#{o.numero}</span>
              <span className="flex-1 text-sm font-medium text-gray-200 truncate">{(o as any).clientes?.nome ?? o.cliente_nome}</span>
              <span className="text-sm font-semibold text-white tabular-nums">{R$(o.total)}</span>
              <Badge status={o.status} />
            </button>
          ))}
        </div>
      )}

      {/* Modules grid */}
      <div>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Módulos</p>
        <div className="grid grid-cols-4 gap-3">
          {MODULES.map(m => (
            <button key={m.screen} onClick={() => onNavigate(m.screen)}
              className={`card bg-gradient-to-br ${m.color} p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform cursor-pointer border`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-semibold text-gray-200">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* New quote FAB */}
      <Btn icon={<Plus size={16} />} size="lg" full onClick={() => onNavigate('orcamento-novo')}>
        Novo Orçamento
      </Btn>
    </div>
  )
}

