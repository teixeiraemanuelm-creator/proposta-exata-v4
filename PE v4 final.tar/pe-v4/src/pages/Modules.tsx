import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, BarChart3, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts'
import {
  getClientes, salvarCliente, deletarCliente,
  getProdutos, salvarProduto, deletarProduto,
  getRecibos, salvarRecibo, deletarRecibo,
  getVendedores, salvarVendedor, deletarVendedor,
  getFormasPagamento, salvarFormaPagamento, deletarFormaPagamento,
  getOrcamentos, getRecibos as getRecibosAll,
  getEstoque, getMovimentacoes, salvarEmpresa,
} from '@/lib/supabase'
import { R$, fmtData, hoje, buscaCEP, maskCPFCNPJ, maskTelefone, maskCEP } from '@/lib/utils'
import { Btn, Input, Textarea, Select, Modal, Spinner, PageHeader, EmptyState } from '@/components/ui'

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
export function Clientes() {
  const { empresa } = useAuth()
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  useEffect(() => {
    if (!empresa) return
    getClientes(empresa.id).then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [empresa])

  function openModal(item?: any) {
    setForm(item ?? { tipo: 'juridica', empresa_id: empresa?.id })
    setModal({ open: true, item })
  }

  async function handleCEP(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length === 8) {
      setCepLoading(true)
      const addr = await buscaCEP(clean)
      if (addr) setForm((p: any) => ({ ...p, ...addr }))
      setCepLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome?.trim()) return
    setSaving(true)
    const { data } = await salvarCliente({ ...form, empresa_id: empresa?.id })
    if (data) {
      setLista(p => p.some(x => x.id === data.id) ? p.map(x => x.id === data.id ? data : x) : [data, ...p])
      setModal({ open: false })
    }
    setSaving(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir cliente?')) return
    await deletarCliente(id)
    setLista(p => p.filter(c => c.id !== id))
  }

  const filtrado = lista.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpf_cnpj?.includes(search))

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Clientes" subtitle="Gerencie o cadastro de clientes"
        action={<Btn icon={<Plus size={15} />} onClick={() => openModal()}>+ Novo Cliente</Btn>} />

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input className="field pl-9" placeholder="Buscar por nome, email ou CPF/CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-header grid-cols-[1fr_180px_180px_40px]">
          <span>NOME</span><span>CONTATO</span><span>ENDEREÇO</span><span />
        </div>
        {filtrado.length === 0 ? (
          <EmptyState icon={<Search size={24} />} title="Nenhum cliente" desc="Adicione seu primeiro cliente"
            action={<Btn size="sm" icon={<Plus size={13} />} onClick={() => openModal()}>Adicionar</Btn>} />
        ) : filtrado.map(c => (
          <div key={c.id} className="table-row grid-cols-[1fr_180px_180px_40px]" onClick={() => openModal(c)}>
            <div>
              <p className="text-sm font-medium text-white">{c.nome}</p>
              {c.cpf_cnpj && <p className="text-xs text-gray-500">{c.cpf_cnpj}</p>}
            </div>
            <div className="text-xs text-gray-400">
              {c.telefone && <p>{c.telefone}</p>}
              {c.email && <p>{c.email}</p>}
            </div>
            <div className="text-xs text-gray-400">
              {c.cidade && <p>{c.cidade}/{c.estado}</p>}
            </div>
            <button onClick={e => handleDelete(c.id, e)} className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="font-bold text-white mb-3 text-sm">Dados do Cliente</h3>
            <div className="flex flex-col gap-3">
              <Input label="Nome *" value={form.nome ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo ou razão social" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" value={form.email ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                <Input label="Telefone" value={form.telefone ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="CPF/CNPJ" value={form.cpf_cnpj ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, cpf_cnpj: maskCPFCNPJ(e.target.value) }))} placeholder="000.000.000-00" />
                <Input label="RG / IE" value={form.ie ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, ie: e.target.value }))} placeholder="000.000.000" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-bold text-white mb-3 text-sm">Endereço</h3>
            <div className="flex flex-col gap-3">
              <Input label="CEP" value={form.cep ?? ''} placeholder="00000-000"
                onChange={(e: any) => { const v = maskCEP(e.target.value); setForm((p: any) => ({ ...p, cep: v })); handleCEP(v) }}
                suffix={cepLoading ? '...' : undefined} />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Input label="Logradouro" value={form.endereco ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, endereco: e.target.value }))} /></div>
                <Input label="Número" value={form.numero ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, numero: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Bairro" value={form.bairro ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, bairro: e.target.value }))} />
                <Input label="Cidade" value={form.cidade ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, cidade: e.target.value }))} />
                <Input label="UF" value={form.estado ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, estado: e.target.value }))} maxLength={2} />
              </div>
              <Input label="Endereço de Entrega (se diferente)" value={form.endereco_entrega ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, endereco_entrega: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <Btn variant="secondary" full onClick={() => setModal({ open: false })}>Cancelar</Btn>
            <Btn full loading={saving} onClick={handleSave}>Salvar Cliente</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── PRODUTOS ─────────────────────────────────────────────────────────────────
export function Produtos() {
  const { empresa } = useAuth()
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!empresa) return
    getProdutos(empresa.id).then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [empresa])

  function openModal(item?: any) {
    setForm(item ?? { unidade: 'm²', preco_unitario: 0 })
    setModal({ open: true, item })
  }

  async function handleSave() {
    if (!form.nome?.trim()) return
    setSaving(true)
    const { data } = await salvarProduto({ ...form, empresa_id: empresa?.id })
    if (data) {
      setLista(p => p.some(x => x.id === data.id) ? p.map(x => x.id === data.id ? data : x) : [data, ...p])
      setModal({ open: false })
    }
    setSaving(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir produto?')) return
    await deletarProduto(id)
    setLista(p => p.filter(x => x.id !== id))
  }

  const filtrado = lista.filter(p => !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo?.toLowerCase().includes(search.toLowerCase()))
  const UNIDADES = ['m²','m³','m','un','kg','ton','saco','cx','conjunto','h','serv']

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Produtos / Serviços" subtitle={`${lista.length} produto(s) no catálogo`}
        action={<Btn icon={<Plus size={15} />} onClick={() => openModal()}>+ Novo Produto</Btn>} />

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input className="field pl-9" placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtrado.map(p => (
          <div key={p.id} className="card overflow-hidden cursor-pointer hover:border-white/15 transition-all group" onClick={() => openModal(p)}>
            <div className="h-28 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center overflow-hidden">
              {p.imagem_url ? (
                <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl opacity-20">📦</span>
              )}
            </div>
            <div className="p-3">
              {p.codigo && <p className="text-xs text-gray-600 font-mono mb-0.5">{p.codigo}</p>}
              <p className="text-sm font-semibold text-white leading-tight">{p.nome}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.unidade}</p>
              <p className="text-sm font-bold text-brand-500 mt-1">{R$(p.preco_unitario)}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Editar Produto' : 'Novo Produto'}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Código" value={form.codigo ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, codigo: e.target.value }))} placeholder="CD-P01" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Unidade</label>
              <select className="field" style={{ background: '#1a1829' }} value={form.unidade ?? 'm²'} onChange={e => setForm((p: any) => ({ ...p, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u} value={u} style={{ background: '#1a1829' }}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Nome *" value={form.nome ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Piso Drenante 40x40x6" />
          <Textarea label="Descrição" value={form.descricao ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, descricao: e.target.value }))} rows={2} />
          <Input label="Preço (R$) *" type="number" min={0} step="0.01" value={form.preco_unitario ?? 0} onChange={(e: any) => setForm((p: any) => ({ ...p, preco_unitario: parseFloat(e.target.value) || 0 }))} />
          <div>
            <label className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-1 block">Imagem (Opcional)</label>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={() => {}}>🔗 URL</Btn>
              <Btn variant="secondary" size="sm" onClick={() => {}}>⬆ Upload</Btn>
            </div>
            <input className="field mt-2" placeholder="https://..." value={form.imagem_url ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, imagem_url: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" full onClick={() => setModal({ open: false })}>Cancelar</Btn>
            <Btn full loading={saving} onClick={handleSave}>Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── RECIBOS ──────────────────────────────────────────────────────────────────
export function Recibos({ onNovoRecibo }: { onNovoRecibo: () => void }) {
  const { empresa } = useAuth()
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!empresa) return
    getRecibos(empresa.id).then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [empresa])

  async function handleDelete(id: string) {
    if (!confirm('Excluir recibo?')) return
    await deletarRecibo(id)
    setLista(p => p.filter(r => r.id !== id))
  }

  const filtrado = lista.filter(r => !search || (r.clientes?.nome ?? '').toLowerCase().includes(search.toLowerCase()) || String(r.numero).includes(search))

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Recibos" subtitle={`${lista.length} emitido(s)`}
        action={<Btn icon={<Plus size={15} />} onClick={onNovoRecibo}>+ Novo Recibo</Btn>} />

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input className="field pl-9" placeholder="Buscar por cliente ou número..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-header grid-cols-[60px_1fr_120px_120px_40px_40px_40px_40px]">
          <span>Nº</span><span>CLIENTE</span><span>DATA</span><span>VALOR</span>
          <span /><span /><span /><span />
        </div>
        {filtrado.length === 0 ? (
          <EmptyState icon={<BarChart3 size={24} />} title="Nenhum recibo" desc="Emita o primeiro recibo"
            action={<Btn size="sm" icon={<Plus size={13} />} onClick={onNovoRecibo}>Novo</Btn>} />
        ) : filtrado.map(r => (
          <div key={r.id} className="table-row grid-cols-[60px_1fr_120px_120px_40px_40px_40px_40px]">
            <span className="text-xs text-gray-500">#{r.numero}</span>
            <div><p className="text-sm font-medium text-white">{r.clientes?.nome ?? r.cliente_nome}</p>
              {r.observacoes && <p className="text-xs text-gray-500 truncate">{r.observacoes}</p>}</div>
            <span className="text-xs text-gray-400">{fmtData(r.data_pagamento ?? r.created_at)}</span>
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">{R$(r.valor_total ?? r.valor ?? 0)}</span>
            <button className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded" title="Imprimir">🖨</button>
            <button className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded" title="WhatsApp">💬</button>
            <button className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded" title="Email">✉</button>
            <button className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded" onClick={() => handleDelete(r.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReciboForm({ onBack, empresaId }: { onBack: () => void; empresaId: string }) {
  const [clientes, setClientes] = useState<any[]>([])
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [formas, setFormas] = useState<any[]>([])
  const [form, setForm] = useState({ cliente_id: '', orcamento_id: '', valor_total: 0, forma_pagamento: 'PIX', data_pagamento: hoje(), observacoes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getClientes(empresaId).then(({ data }) => setClientes(data ?? []))
    getOrcamentos(empresaId).then(({ data }) => setOrcamentos(data ?? []))
    getFormasPagamento().then(({ data }) => setFormas(data ?? []))
  }, [empresaId])

  function f(p: any) { setForm(prev => ({ ...prev, ...p })) }

  async function handleSave() {
    setSaving(true)
    await salvarRecibo({ ...form, empresa_id: empresaId })
    onBack()
    setSaving(false)
  }

  const orcOptions = [{ value: '', label: 'Sem vínculo' }, ...orcamentos.map(o => ({ value: o.id, label: `#${o.numero} – ${o.clientes?.nome ?? o.cliente_nome}` }))]
  const clienteOptions = [{ value: '', label: 'Selecione um cliente...' }, ...clientes.map(c => ({ value: c.id, label: c.nome }))]
  const formaOptions = formas.map(f => ({ value: f.name, label: f.name }))

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">←</button>
        <h1 className="text-xl font-bold text-white">Recibo #0000</h1>
      </div>
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="font-bold text-white">Informações do Recibo</h2>
        <Select label="Orçamento Vinculado (Opcional)" options={orcOptions} value={form.orcamento_id} onChange={(e: any) => f({ orcamento_id: e.target.value })} />
        <Select label="Cliente *" options={clienteOptions} value={form.cliente_id} onChange={(e: any) => f({ cliente_id: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor Recebido (R$) *" type="number" min={0} step="0.01" value={form.valor_total} onChange={(e: any) => f({ valor_total: parseFloat(e.target.value) || 0 })} />
          {formaOptions.length > 0
            ? <Select label="Forma de Pagamento" options={formaOptions} value={form.forma_pagamento} onChange={(e: any) => f({ forma_pagamento: e.target.value })} />
            : <Input label="Forma de Pagamento" value={form.forma_pagamento} onChange={(e: any) => f({ forma_pagamento: e.target.value })} />
          }
        </div>
        <Input label="Data de Recebimento" type="date" value={form.data_pagamento} onChange={(e: any) => f({ data_pagamento: e.target.value })} />
        <Textarea label="Referente a (Descrição / Número do Orçamento)" value={form.observacoes} onChange={(e: any) => f({ observacoes: e.target.value })} placeholder="Referente ao pagamento do orçamento..." />
      </div>
      <div className="flex gap-3 mt-4">
        <Btn variant="secondary" full onClick={onBack}>Cancelar</Btn>
        <Btn full loading={saving} onClick={handleSave}>Emitir Recibo</Btn>
      </div>
    </div>
  )
}

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
export function Estoque() {
  const [tab, setTab] = useState<'atual'|'movimentacoes'>('atual')
  const [estoque, setEstoque] = useState<any[]>([])
  const [movs, setMovs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getEstoque(), getMovimentacoes()]).then(([{ data: e }, { data: m }]) => {
      setEstoque(e ?? [])
      setMovs(m ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Estoque" subtitle={`${estoque.length} produto(s)`}
        action={<Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={() => {}}>Atualizar</Btn>} />

      <div className="flex gap-2 mb-5">
        {(['atual', 'movimentacoes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'atual' ? 'Estoque atual' : 'Movimentações'}
          </button>
        ))}
      </div>

      {tab === 'atual' ? (
        <div className="card overflow-hidden">
          <div className="table-header grid-cols-[1fr_80px_80px_80px]">
            <span>PRODUTO</span><span>UNID.</span><span>QTD</span><span>MÍN.</span>
          </div>
          {estoque.length === 0 ? (
            <EmptyState icon={<BarChart3 size={24} />} title="Sem estoque" desc="Nenhum produto no estoque" />
          ) : estoque.map(e => (
            <div key={e.id} className="table-row grid-cols-[1fr_80px_80px_80px]">
              <p className="text-sm font-medium text-white">{e.products?.name ?? '–'}</p>
              <span className="text-xs text-gray-400">{e.unit}</span>
              <span className={`text-sm font-semibold tabular-nums ${(e.quantity ?? 0) <= (e.min_quantity ?? 0) ? 'text-red-400' : 'text-emerald-400'}`}>{e.quantity ?? 0}</span>
              <span className="text-xs text-gray-500">{e.min_quantity ?? 0}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-header grid-cols-[1fr_80px_80px_120px]">
            <span>PRODUTO</span><span>TIPO</span><span>QTD</span><span>DATA</span>
          </div>
          {movs.map(m => (
            <div key={m.id} className="table-row grid-cols-[1fr_80px_80px_120px]">
              <p className="text-sm text-white">{m.products?.name ?? '–'}</p>
              <span className={`text-xs font-semibold ${m.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{m.type}</span>
              <span className="text-sm tabular-nums text-white">{m.quantity}</span>
              <span className="text-xs text-gray-400">{fmtData(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EQUIPE ───────────────────────────────────────────────────────────────────
const CORES = ['#f97316','#3b82f6','#22c55e','#f59e0b','#ec4899','#6366f1','#06b6d4','#ef4444']

export function Equipe() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [form, setForm] = useState<any>({ avatar_color: CORES[0], role: 'seller' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getVendedores().then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [])

  function openModal(item?: any) { setForm(item ?? { avatar_color: CORES[0], role: 'seller' }); setModal({ open: true, item }) }

  async function handleSave() {
    setSaving(true)
    const { data } = await salvarVendedor(form)
    if (data) { setLista(p => p.some(x => x.id === data.id) ? p.map(x => x.id === data.id ? data : x) : [...p, data]); setModal({ open: false }) }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Equipe de Vendas" subtitle={`${lista.length} membro(s)`}
        action={<Btn icon={<Plus size={15} />} onClick={() => openModal()}>+ Novo Vendedor</Btn>} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map(v => (
          <div key={v.id} className="card p-4 cursor-pointer hover:border-white/15 transition-all" onClick={() => openModal(v)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: v.avatar_color ?? '#f97316' }}>
                {v.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">{v.name}</p>
                <p className="text-xs text-brand-500 font-medium capitalize">{v.role === 'admin' ? 'Admin' : 'Vendedor'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['0', 'Orç.'], ['0%', 'Conv.'], ['0,00', 'Receita']].map(([val, lbl]) => (
                <div key={lbl} className="bg-white/5 rounded-lg py-2">
                  <p className="text-sm font-bold text-brand-500">{val}</p>
                  <p className="text-xs text-gray-500">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Novo Vendedor">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-2">Cor do Avatar</p>
            <div className="flex gap-2">
              {CORES.map(c => (
                <button key={c} onClick={() => setForm((p: any) => ({ ...p, avatar_color: c }))}
                  className={`w-8 h-8 rounded-xl transition-all ${form.avatar_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <Input label="Nome *" value={form.name ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
          <Input label="Email *" type="email" value={form.email ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, email: e.target.value }))} />
          <Input label="Telefone" value={form.phone ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, phone: maskTelefone(e.target.value) }))} />
          <Select label="Função" value={form.role ?? 'seller'} onChange={(e: any) => setForm((p: any) => ({ ...p, role: e.target.value }))}
            options={[{ value: 'admin', label: 'Admin' }, { value: 'seller', label: 'Vendedor' }, { value: 'viewer', label: 'Visualizador' }]} />
          <div className="flex gap-3">
            <Btn variant="secondary" full onClick={() => setModal({ open: false })}>Cancelar</Btn>
            <Btn full loading={saving} onClick={handleSave}>Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
export function Relatorios() {
  const { empresa } = useAuth()
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [recibos, setRecibos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!empresa) return
    Promise.all([getOrcamentos(empresa.id), getRecibos(empresa.id)]).then(([{ data: o }, { data: r }]) => {
      setOrcamentos(o ?? [])
      setRecibos(r ?? [])
      setLoading(false)
    })
  }, [empresa])

  const filtrados = orcamentos.filter(o => {
    const d = new Date(o.created_at)
    return d.getMonth() + 1 === mes && d.getFullYear() === ano
  })

  const aprovados = filtrados.filter(o => o.status === 'aprovado')
  const totalEmitido = filtrados.reduce((s, o) => s + o.total, 0)
  const receitaAprovada = aprovados.reduce((s, o) => s + o.total, 0)
  const receitaRecibos = recibos.filter(r => {
    const d = new Date(r.data_pagamento ?? r.created_at)
    return d.getMonth() + 1 === mes && d.getFullYear() === ano
  }).reduce((s, r) => s + (r.valor_total ?? 0), 0)
  const conversao = filtrados.length > 0 ? Math.round((aprovados.length / filtrados.length) * 100) : 0

  const ultimos6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ano, mes - 1 - i, 1)
    const m = d.getMonth() + 1, a = d.getFullYear()
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    const total = orcamentos.filter(o => {
      const dd = new Date(o.created_at)
      return dd.getMonth() + 1 === m && dd.getFullYear() === a && o.status === 'aprovado'
    }).reduce((s, o) => s + o.total, 0)
    return { label, total }
  }).reverse()

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesOptions = MESES.map((m, i) => ({ value: String(i + 1), label: m }))
  const anoOptions = [2024, 2025, 2026, 2027].map(a => ({ value: String(a), label: String(a) }))

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  const maxBar = Math.max(...ultimos6.map(d => d.total), 1)

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Relatórios" subtitle="Análise de desempenho"
        action={<Btn icon={<BarChart3 size={14} />}>↓ Exportar PDF</Btn>} />

      <div className="flex items-center gap-3 mb-5">
        <BarChart3 size={16} className="text-brand-500" />
        <Select options={mesOptions} value={String(mes)} onChange={(e: any) => setMes(parseInt(e.target.value))} className="w-36" />
        <Select options={anoOptions} value={String(ano)} onChange={(e: any) => setAno(parseInt(e.target.value))} className="w-24" />
        <span className="text-xs text-emerald-400">✓ {MESES[mes - 1]} {ano}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Receita Aprovada', value: R$(receitaAprovada), sub: `${aprovados.length} aprovados`, color: 'text-emerald-400' },
          { label: 'Total Emitido', value: R$(totalEmitido), sub: `${filtrados.length} orç.`, color: 'text-brand-500' },
          { label: 'Total Recebido', value: R$(receitaRecibos), sub: 'via recibos', color: 'text-blue-400' },
          { label: 'Conversão', value: `${conversao}%`, sub: 'aprovados/total', color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-600">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-white text-sm mb-4">Receita — Últimos 6 meses</h3>
        <div className="flex flex-col gap-2">
          {ultimos6.map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-8">{d.label}</span>
              <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500/70 rounded-full transition-all" style={{ width: `${(d.total / maxBar) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400 tabular-nums w-24 text-right">{R$(d.total)}</span>
            </div>
          ))}
        </div>
      </div>

      {filtrados.length === 0 && (
        <div className="card p-8 flex flex-col items-center gap-2 text-center">
          <BarChart3 size={32} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Nenhum orçamento em {MESES[mes - 1]}/{ano}</p>
        </div>
      )}
    </div>
  )
}

// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
export function Pagamentos() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [form, setForm] = useState<any>({ name: '', is_active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getFormasPagamento().then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data } = await salvarFormaPagamento(form)
    if (data) { setLista(p => p.some(x => x.id === data.id) ? p.map(x => x.id === data.id ? data : x) : [...p, data]); setModal({ open: false }) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir forma de pagamento?')) return
    await deletarFormaPagamento(id)
    setLista(p => p.filter(x => x.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Formas de Pagamento" subtitle="Gerencie as opções disponíveis"
        action={<Btn icon={<Plus size={15} />} onClick={() => { setForm({ name: '', is_active: true }); setModal({ open: true }) }}>+ Nova Forma</Btn>} />

      <div className="card overflow-hidden">
        <div className="table-header grid-cols-[40px_1fr_1fr_80px]">
          <span>STATUS</span><span>NOME</span><span>DETALHES</span><span />
        </div>
        {lista.map(p => (
          <div key={p.id} className="table-row grid-cols-[40px_1fr_1fr_80px]">
            <span className={`text-lg ${p.is_active ? 'text-emerald-400' : 'text-gray-600'}`}>{p.is_active ? '✅' : '⭕'}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">💳</span>
              <span className="text-sm font-medium text-white">{p.name}</span>
            </div>
            <span className="text-xs text-gray-500">{p.details ?? '–'}</span>
            <div className="flex gap-1">
              <button onClick={() => { setForm(p); setModal({ open: true }) }} className="p-1.5 rounded text-gray-600 hover:text-white hover:bg-white/5"><Edit2 size={13} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Forma de Pagamento">
        <div className="flex flex-col gap-3">
          <Input label="Nome *" value={form.name ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Ex: PIX, Boleto, Cartão..." />
          <Input label="Detalhes (opcional)" value={form.details ?? ''} onChange={(e: any) => setForm((p: any) => ({ ...p, details: e.target.value }))} placeholder="Informações adicionais..." />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm((p: any) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-brand-500" />
            <span className="text-sm text-gray-300">Ativo</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" full onClick={() => setModal({ open: false })}>Cancelar</Btn>
            <Btn full loading={saving} onClick={handleSave}>Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
export function Configuracoes() {
  const { empresa, setEmpresa } = useAuth()
  const [form, setForm] = useState<any>(empresa ?? {})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  function f(p: any) { setForm((prev: any) => ({ ...prev, ...p })) }

  async function handleSave() {
    if (!empresa?.id) return
    setLoading(true)
    const { data } = await salvarEmpresa(empresa.id, form)
    if (data) { setEmpresa(data); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <PageHeader title="Configurações" subtitle="Gerencie as informações e identidade da sua empresa" />

      <div className="card p-5 mb-4">
        <h2 className="font-bold text-white mb-1 text-sm">Tema do Aplicativo</h2>
        <p className="text-xs text-gray-500 mb-3">Modo Escuro (Preto &amp; Laranja)</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ id: 'dark', label: '🌙 Escuro (Laranja)' }, { id: 'light', label: '☀ Claro (Azul)' }].map(t => (
            <button key={t.id} className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${t.id === 'dark' ? 'border-brand-500 text-brand-500' : 'border-white/10 text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-bold text-white mb-1 text-sm">Dados da Empresa</h2>
        <p className="text-xs text-gray-500 mb-4">Informações que aparecem nos orçamentos e PDFs</p>
        <div className="flex flex-col gap-3">
          <Input label="Nome da Empresa / Razão Social" value={form.nome ?? ''} onChange={(e: any) => f({ nome: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CNPJ" value={form.cnpj ?? ''} onChange={(e: any) => f({ cnpj: e.target.value })} placeholder="45.027.259/0001-64" />
            <Input label="Inscrição Estadual (IE)" value={form.ie ?? ''} onChange={(e: any) => f({ ie: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefone / WhatsApp" value={form.telefone ?? ''} onChange={(e: any) => f({ telefone: e.target.value })} placeholder="(16) 98116-4639" />
            <Input label="Email" value={form.email ?? ''} onChange={(e: any) => f({ email: e.target.value })} />
          </div>
          <Input label="CEP" value={form.cep ?? ''} onChange={(e: any) => f({ cep: e.target.value })} placeholder="14075-610" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Input label="Logradouro" value={form.endereco ?? ''} onChange={(e: any) => f({ endereco: e.target.value })} placeholder="Avenida Marechal Costa e Silva" /></div>
            <Input label="Número" value={form.numero ?? ''} onChange={(e: any) => f({ numero: e.target.value })} placeholder="2875" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Bairro" value={form.bairro ?? ''} onChange={(e: any) => f({ bairro: e.target.value })} placeholder="Vila Brasil" />
            <Input label="Cidade" value={form.cidade ?? ''} onChange={(e: any) => f({ cidade: e.target.value })} placeholder="Ribeirão Preto" />
            <Input label="UF" value={form.estado ?? ''} onChange={(e: any) => f({ estado: e.target.value })} maxLength={2} placeholder="SP" />
          </div>
          <div>
            <Input label="Logotipo (URL da imagem)" value={form.logo_url ?? ''} onChange={(e: any) => f({ logo_url: e.target.value })} placeholder="https://..." />
            {form.logo_url && <img src={form.logo_url} alt="logo" className="mt-2 w-16 h-16 object-contain rounded-lg bg-white/5 p-2" />}
          </div>
        </div>
      </div>

      <Btn full size="lg" loading={loading} onClick={handleSave} className={saved ? '!bg-emerald-600 hover:!bg-emerald-600' : ''}>
        {saved ? '✓ Salvo!' : 'Salvar Informações'}
      </Btn>
    </div>
  )
}
