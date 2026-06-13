import { useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'
import { Plus, Search, ArrowLeft, Trash2, Edit2, FileDown, MessageCircle, Mail, Link2, Copy, Check, Receipt, QrCode, X } from 'lucide-react'
import { useAuth } from '@/contexts'
import { getOrcamentos, getOrcamento, salvarOrcamento, salvarItens, deletarOrcamento, getClientes, getProdutos, getVendedores, supabase, podecriarOrcamento } from '@/lib/supabase'
import { R$, fmtData, hoje, calcItem, calcTotais, enviarWhatsApp, gerarPDF } from '@/lib/utils'
import { Badge, Btn, Input, Select, Textarea, Spinner, PageHeader, EmptyState, Modal } from '@/components/ui'
import type { Screen } from '@/types'
import { CheckoutPro } from '@/pages/Planos'

// ─── Lista (v2) ───────────────────────────────────────────────────────────────
export function OrcamentosLista({ onNavigate }: { onNavigate: (s: Screen, id?: string) => void }) {
  const { empresa } = useAuth()
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!empresa) return
    getOrcamentos(empresa.id).then(({ data }) => { setLista(data ?? []); setLoading(false) })
  }, [empresa])

  const filtrado = lista.filter(o => {
    if (!search) return true
    const s = search.toLowerCase()
    return (o.clientes?.nome ?? o.cliente_nome ?? '').toLowerCase().includes(s) || String(o.numero).includes(s)
  })

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir orçamento?')) return
    await deletarOrcamento(id)
    setLista(p => p.filter(o => o.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="w-full">
      <PageHeader title="Orçamentos" subtitle="Gerencie e emita propostas"
        action={<Btn icon={<Plus size={15} />} onClick={() => onNavigate('orcamento-novo')}>Novo Orçamento</Btn>} />

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input className="field pl-9" placeholder="Buscar por cliente ou número (#1001)..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="table-header grid-cols-[60px_1fr_100px_100px_100px_40px]">
          <span>NÚMERO</span><span>CLIENTE</span><span>DATA</span><span>STATUS</span><span>VALOR</span><span />
        </div>
        {filtrado.length === 0 ? (
          <EmptyState icon={<FileDown size={26} />} title="Nenhum orçamento" desc="Crie seu primeiro orçamento"
            action={<Btn size="sm" icon={<Plus size={13} />} onClick={() => onNavigate('orcamento-novo')}>Criar</Btn>} />
        ) : filtrado.map(o => (
          // BUG 3 FIX: botões sempre visíveis (removido group/opacity-0), grid ajustado para 80px na última coluna
          <div key={o.id} className="table-row grid-cols-[60px_1fr_100px_100px_100px_80px]" onClick={() => onNavigate('orcamento-detalhe', o.id)}>
            <span className="text-xs text-gray-500 font-mono">#{o.numero}</span>
            <span className="text-sm font-medium text-white truncate">{o.clientes?.nome ?? o.cliente_nome ?? '–'}</span>
            <span className="text-xs text-gray-400">{fmtData(o.created_at)}</span>
            <span><Badge status={o.status} /></span>
            <span className="text-sm font-semibold text-white tabular-nums">{R$(o.total)}</span>
            <div className="flex gap-1">
              <button onClick={e => { e.stopPropagation(); onNavigate('orcamento-novo', o.id) }} className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={13} /></button>
              <button onClick={e => handleDelete(o.id, e)} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Formulário ───────────────────────────────────────────────────────────────
const UNIDADES = ['m2', 'm3', 'un', 'kg', 'ton', 'm', 'l', 'saco', 'cx', 'conjunto']
const UNIDADES_LABEL: Record<string, string> = {
  m2: 'm²', m3: 'm³', un: 'un', kg: 'kg', ton: 'ton', m: 'm', l: 'l', saco: 'saco', cx: 'cx', conjunto: 'conjunto'
}

export function OrcamentoForm({ editId, onNavigate }: { editId?: string; onNavigate: (s: Screen, id?: string) => void }) {
  const { empresa, isPro, refreshAssinatura } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [gateBlocked, setGateBlocked] = useState(false)
  // BUG 1 FIX: loading só começa true se há editId, caso contrário false desde o início
  const [loading, setLoading] = useState(!!editId)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])

  const [clienteId, setClienteId] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [dataEmissao, setDataEmissao] = useState(hoje())
  // BUG 2 FIX: validade armazenada sempre como número de dias (string numérica)
  const [validade, setValidade] = useState('15')
  const [responsavel, setResponsavel] = useState('Departamento Comercial')
  const [itens, setItens] = useState<any[]>([])
  const [condicaoPagamento, setCondicaoPagamento] = useState('50% sinal, 50% na entrega. PIX ou Transferência.')
  const [servicos, setServicos] = useState('Produção sob medida conforme projeto.')
  const [observacoes, setObservacoes] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [frete, setFrete] = useState(0)

  useEffect(() => {
    if (!empresa) return

    // Verificar limite do plano Free (só para novos orçamentos)
    if (!editId && !isPro) {
      podecriarOrcamento(empresa.id).then(({ data }) => {
        if (data && !data.pode) {
          setGateBlocked(true)
        }
      })
    }

    // BUG 1 FIX: carrega catálogos e orçamento em paralelo, só libera loading após tudo
    const catalogPromises = [
      getClientes(empresa.id).then(({ data }) => setClientes(data ?? [])),
      getProdutos(empresa.id).then(({ data }) => setProdutos(data ?? [])),
      getVendedores().then(({ data }) => setVendedores(data ?? [])),
    ]

    if (editId) {
      const orcPromise = getOrcamento(editId).then(({ data }) => {
        if (!data) return
        setClienteId(data.cliente_id ?? '')
        setStatus(data.status ?? 'rascunho')
        setDataEmissao(data.data_emissao ?? hoje())

        // BUG 2 FIX: validade no banco é uma data ISO (ex: "2025-08-01")
        // Converte de volta para número de dias a partir de hoje
        if (data.validade) {
          const validadeDate = new Date(data.validade + 'T00:00:00') // força meia-noite local
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          const diffMs = validadeDate.getTime() - hoje.getTime()
          const diffDias = Math.max(1, Math.round(diffMs / 86400000))
          setValidade(String(diffDias))
        } else {
          setValidade('15')
        }

        setResponsavel((data as any).responsavel ?? 'Departamento Comercial')
        setCondicaoPagamento(data.condicao_pagamento ?? '')
        setServicos((data as any).servicos ?? '')
        setObservacoes(data.observacoes ?? '')
        setDesconto(data.desconto_percentual ?? 0)
        setFrete(data.frete ?? 0)

        // BUG 1 FIX: garante que itens são carregados corretamente
        const its = (data as any).orcamento_itens ?? []
        setItens(its.map((i: any) => ({ ...i, _id: i.id ?? crypto.randomUUID() })))
      })

      Promise.all([...catalogPromises, orcPromise]).finally(() => setLoading(false))
    } else {
      Promise.all(catalogPromises)
      // Para novo orçamento, não há loading
    }
  }, [empresa])

  function addItem() {
    setItens(p => [...p, { _id: crypto.randomUUID(), descricao: '', unidade: 'm2', quantidade: 1, preco_unitario: 0, produto_id: null }])
  }

  function updateItem(idx: number, partial: any) {
    setItens(p => p.map((it, i) => i === idx ? { ...it, ...partial } : it))
  }

  function removeItem(idx: number) { setItens(p => p.filter((_, i) => i !== idx)) }

  const { subtotal, descontoVal, total } = calcTotais(itens, desconto, frete)

  async function handleSave() {
    if (!empresa) return
    if (!clienteId) { alert('Selecione um cliente antes de salvar.'); return }
    setSaving(true)
    const clienteNome = clientes.find(c => c.id === clienteId)?.nome ?? ''

    // BUG 2 FIX: calcula data de validade a partir dos dias informados
    const validadeDias = parseInt(validade) || 15
    const validadeDate = new Date()
    validadeDate.setDate(validadeDate.getDate() + validadeDias)
    const validadeStr = validadeDate.toISOString().split('T')[0]

    const orcDados: any = {
      empresa_id: empresa.id,
      cliente_id: clienteId,
      cliente_nome: clienteNome,
      status: status as any,
      data_emissao: dataEmissao,
      validade: validadeStr,
      responsavel,
      condicao_pagamento: condicaoPagamento,
      observacoes,
      desconto_percentual: desconto,
      desconto_valor: descontoVal,
      frete,
      subtotal,
      total,
    }
    if (editId) orcDados.id = editId

    const { data, error } = await salvarOrcamento(orcDados)
    if (error) { console.error(error); alert('Erro ao salvar: ' + error.message); setSaving(false); return }
    if (data?.id) {
      await salvarItens(data.id, itens.map(({ _id, id, orcamento_id, created_at, updated_at, ordem, ...rest }) => rest))
      onNavigate('orcamento-detalhe', data.id)
    }
    setSaving(false)
  }

  if (gateBlocked) return (
    <div className="w-full flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center">
        <span className="text-3xl">👑</span>
      </div>
      <div>
        <h2 className="text-xl font-black text-white mb-2">Limite atingido</h2>
        <p className="text-sm text-gray-400 max-w-xs">Você usou os 5 orçamentos do plano Free este mês.</p>
        <p className="text-sm text-gray-500 mt-1">Assine o Pro para criar orçamentos ilimitados.</p>
      </div>
      <Btn icon={<Plus size={15} />} onClick={() => setShowCheckout(true)}>Assinar Pro — R$ 47/mês</Btn>
      <button onClick={() => onNavigate('orcamentos')} className="text-sm text-gray-600 hover:text-gray-400">Voltar</button>
      {showCheckout && <CheckoutPro onClose={() => setShowCheckout(false)} onSuccess={() => { refreshAssinatura(); setGateBlocked(false) }} />}
    </div>
  )

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  const clienteOptions = [{ value: '', label: 'Selecione um cliente...' }, ...clientes.map(c => ({ value: c.id, label: c.nome }))]
  const statusOptions = [
    { value: 'rascunho', label: 'Rascunho' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'em_analise', label: 'Em análise' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'recusado', label: 'Recusado' },
  ]

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => onNavigate('orcamentos')} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-white">{editId ? 'Editar Orçamento' : 'Orçamento #0000'}</h1>
      </div>

      {/* Info geral */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Informações Gerais</h2>
          <Select options={statusOptions} value={status} onChange={(e: any) => setStatus(e.target.value)} className="w-36" />
        </div>
        <div className="flex flex-col gap-3">
          <Select label="Cliente *" options={clienteOptions} value={clienteId} onChange={(e: any) => setClienteId(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data de Emissão" type="date" value={dataEmissao} onChange={(e: any) => setDataEmissao(e.target.value)} />
            <Input label="Validade (dias)" type="number" value={validade} onChange={(e: any) => setValidade(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider mb-1 block">Responsável</label>
            <select className="field" style={{ background: '#1a1829' }} value={responsavel} onChange={e => setResponsavel(e.target.value)}>
              <option value="Departamento Comercial" style={{ background: '#1a1829' }}>Departamento Comercial</option>
              {vendedores.map(v => <option key={v.id} value={v.name} style={{ background: '#1a1829' }}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <h2 className="font-bold text-white">Itens do Orçamento</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {itens.length === 0 && (
            <p className="text-center text-sm text-gray-600 py-4">Nenhum item adicionado. Clique no botão abaixo para começar.</p>
          )}
          {itens.map((item, idx) => (
            <div key={item._id} className="bg-white/3 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <select className="field" style={{ background: '#1a1829' }}
                    onChange={e => {
                      const p = produtos.find(p => p.id === e.target.value)
                      if (p) updateItem(idx, { produto_id: p.id, descricao: `${p.nome} – ${p.descricao ?? ''}`.trim(), unidade: p.unidade, preco_unitario: p.preco_unitario })
                    }}>
                    <option value="" style={{ background: '#1a1829' }}>Selecionar do catálogo...</option>
                    {produtos.map(p => <option key={p.id} value={p.id} style={{ background: '#1a1829' }}>{p.nome} — {R$(p.preco_unitario)}</option>)}
                  </select>
                </div>
                <button onClick={() => removeItem(idx)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
              <input className="field" placeholder="Descrição do produto/serviço" value={item.descricao} onChange={e => updateItem(idx, { descricao: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">QTD</label>
                  <input type="number" className="field no-spinner" value={item.quantidade} min={0} step="any" onChange={e => updateItem(idx, { quantidade: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">UNIDADE</label>
                  <select className="field" style={{ background: '#1a1829' }} value={item.unidade} onChange={e => updateItem(idx, { unidade: e.target.value })}>
                    {UNIDADES.map(u => <option key={u} value={u} style={{ background: '#1a1829' }}>{UNIDADES_LABEL[u] ?? u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">VALOR UNIT.</label>
                  <input type="number" className="field no-spinner" value={item.preco_unitario} min={0} step="0.01" onChange={e => updateItem(idx, { preco_unitario: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total: <span className="text-brand-500 font-semibold">{R$(calcItem(item.quantidade, item.preco_unitario))}</span></span>
              </div>
            </div>
          ))}
          <button onClick={addItem} className="w-full border border-dashed border-white/15 rounded-xl py-3 text-sm text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all flex items-center justify-center gap-2">
            <Plus size={14} /> Adicionar Item
          </button>
        </div>
      </div>

      {/* Condições */}
      <div className="card p-5 mb-4">
        <h2 className="font-bold text-white mb-4">Condições</h2>
        <div className="flex flex-col gap-3">
          <Textarea label="Condições de Pagamento" value={condicaoPagamento} onChange={(e: any) => setCondicaoPagamento(e.target.value)} rows={2} />
          <Textarea label="Serviços Inclusos / Escopo" value={servicos} onChange={(e: any) => setServicos(e.target.value)} rows={2} />
          <Textarea label="Observações Importantes" value={observacoes} onChange={(e: any) => setObservacoes(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Desconto (%)" type="number" min={0} max={100} value={desconto} onChange={(e: any) => setDesconto(parseFloat(e.target.value) || 0)} className="no-spinner" />
            <Input label="Frete (R$)" type="number" min={0} value={frete} onChange={(e: any) => setFrete(parseFloat(e.target.value) || 0)} className="no-spinner" />
          </div>
          <div className="flex flex-col gap-1 pt-2 border-t border-white/6">
            <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span className="tabular-nums">{R$(subtotal)}</span></div>
            {descontoVal > 0 && <div className="flex justify-between text-sm text-red-400"><span>Desconto ({desconto}%)</span><span className="tabular-nums">-{R$(descontoVal)}</span></div>}
            {frete > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Frete</span><span className="tabular-nums">+{R$(frete)}</span></div>}
            <div className="flex justify-between text-base font-bold text-white"><span>Total</span><span className="text-brand-500 tabular-nums">{R$(total)}</span></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Btn variant="secondary" full onClick={() => onNavigate('orcamentos')}>Cancelar</Btn>
        <Btn full loading={saving} onClick={handleSave}>Salvar Orçamento</Btn>
      </div>
    </div>
  )
}

// ─── Detalhe ──────────────────────────────────────────────────────────────────
export function OrcamentoDetalhe({ id, onNavigate }: { id: string; onNavigate: (s: Screen, id?: string) => void }) {
  const { empresa } = useAuth()
  const [orc, setOrc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pixModal, setPixModal] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixErro, setPixErro] = useState('')

  useEffect(() => {
    getOrcamento(id).then(({ data }) => { setOrc(data); setLoading(false) })
  }, [id])

  async function handleGerarPix() {
    if (!orc) return
    setPixLoading(true)
    setPixErro('')
    setPixData(null)
    setPixModal(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-pix`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            valor: orc.total,
            descricao: `Orcamento #${orc.numero} - ${orc.clientes?.nome ?? orc.cliente_nome}`,
            email: orc.clientes?.email ?? 'cliente@email.com',
            nome: orc.clientes?.nome ?? orc.cliente_nome ?? 'Cliente',
            cpf: orc.clientes?.cpf_cnpj ?? '00000000000',
            orcamento_id: orc.id,
            numero: orc.numero,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setPixErro(data.erro ?? 'Erro ao gerar Pix')
      } else {
        setPixData(data)
      }
    } catch (e) {
      setPixErro('Erro de conexao. Tente novamente.')
    }
    setPixLoading(false)
  }

  async function changeStatus(status: string) {
    await salvarOrcamento({ id, status })
    setOrc((p: any) => ({ ...p, status }))
  }

  async function handleDelete() {
    if (!confirm('Excluir este orçamento?')) return
    await deletarOrcamento(id)
    onNavigate('orcamentos')
  }

  function copyLink() {
    const link = `${window.location.origin}/orcamento-publico/${id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!orc) return <div className="text-gray-500 text-center py-20">Não encontrado</div>

  const itens = orc.orcamento_itens ?? []
  const cliente = orc.clientes

  // BUG 2 FIX: validade no banco é data ISO — mostra dias restantes corretamente
  const validadeDias = orc.validade
    ? Math.max(0, Math.ceil((new Date(orc.validade + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000))
    : null

  // Format masks
  const cnpjFormatted = (empresa?.cnpj ?? '').replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  const telFormatted = (empresa?.telefone ?? '').replace(/\D/g, '')
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')

  return (
    <div className="w-full pb-10">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onNavigate('orcamentos')} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><ArrowLeft size={16} /></button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-400">Orçamentos</span>
          <span className="text-gray-600">/</span>
          <h1 className="text-sm font-semibold text-white">Orçamento #{orc.numero}</h1>
          <select
            value={orc.status}
            onChange={async (e) => {
              const newStatus = e.target.value
              await salvarOrcamento({ id, status: newStatus })
              setOrc((prev: any) => ({ ...prev, status: newStatus }))
            }}
            className="text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer"
            style={{
              background: orc.status === 'aprovado' ? 'rgba(34,197,94,0.2)' :
                          orc.status === 'enviado' ? 'rgba(59,130,246,0.2)' :
                          orc.status === 'recusado' ? 'rgba(239,68,68,0.2)' :
                          orc.status === 'em_analise' ? 'rgba(234,179,8,0.2)' :
                          'rgba(100,100,120,0.3)',
              color: orc.status === 'aprovado' ? '#4ade80' :
                     orc.status === 'enviado' ? '#60a5fa' :
                     orc.status === 'recusado' ? '#f87171' :
                     orc.status === 'em_analise' ? '#facc15' :
                     '#9998b8'
            }}
          >
            <option value="rascunho">Rascunho</option>
            <option value="enviado">Enviado</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        {empresa && <span className="text-xs text-gray-500 hidden sm:block">{empresa.nome}</span>}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Btn variant="whatsapp" size="sm" icon={<MessageCircle size={13} />}
          onClick={() => enviarWhatsApp(cliente?.telefone, id, orc.numero, empresa?.nome ?? '')}>
          WhatsApp
        </Btn>
        <Btn variant="secondary" size="sm" icon={<Mail size={13} />} onClick={() => {
            const link = `${window.location.origin}/orcamento-publico/${id}`
            const assunto = encodeURIComponent(`Orçamento #${String(orc.numero).padStart(4,'0')} - ${empresa?.nome ?? ''}`)
            const corpo = encodeURIComponent(`Olá,\n\nSegue o link para visualizar o orçamento:\n\n${link}\n\nAtenciosamente,\n${empresa?.nome ?? ''}`)
            window.open(`mailto:${cliente?.email ?? ''}?subject=${assunto}&body=${corpo}`)
          }}>Email</Btn>
        <Btn variant="secondary" size="sm" icon={copied ? <Check size={13} /> : <Link2 size={13} />} onClick={copyLink}>
          {copied ? 'Copiado!' : 'Copiar link'}
        </Btn>
        <Btn variant="secondary" size="sm" icon={<FileDown size={13} />} onClick={() => gerarPDF(orc, empresa, itens)}>PDF</Btn>
        <Btn variant="secondary" size="sm" icon={<Edit2 size={13} />} onClick={() => onNavigate('orcamento-novo', id)}>Editar</Btn>
        <Btn variant="secondary" size="sm" icon={<Copy size={13} />}>Duplicar</Btn>
        <Btn variant="secondary" size="sm" icon={<QrCode size={13} />} onClick={handleGerarPix}>Pix</Btn>
        <Btn variant="secondary" size="sm" icon={<Receipt size={13} />} onClick={() => onNavigate('recibo-novo')}>Gerar Recibo</Btn>
        <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete} />
      </div>

      {/* Document card */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-white/6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cliente</p>
          <p className="font-bold text-white text-lg leading-tight">{cliente?.nome ?? orc.cliente_nome}</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
            <div>
              <p className="text-xs text-gray-500">Pagamento</p>
              <p className="text-sm text-gray-200">{orc.condicao_pagamento || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Validade</p>
              <p className="text-sm text-gray-200">{validadeDias !== null ? `${validadeDias} dias` : '–'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="text-sm text-gray-200">{orc.data_emissao ? new Date(orc.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR') : fmtData(orc.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm text-gray-200">{orc.responsavel || 'Departamento Comercial'}</p>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="p-5">
          <p className="text-sm font-bold text-white mb-3">Itens</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="text-left pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Descrição do Produto/Serviço</th>
                <th className="text-center pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-12">UND</th>
                <th className="text-center pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-14">QTD</th>
                <th className="text-right pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-24">UNIT</th>
                <th className="text-right pb-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-28">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item: any, i: number) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="py-3 text-gray-500 text-xs">{i + 1}</td>
                  <td className="py-3 pr-4 text-gray-200">{item.descricao}</td>
                  <td className="py-3 text-center text-xs text-gray-400">{item.unidade === 'm2' ? 'm²' : item.unidade === 'm3' ? 'm³' : item.unidade}</td>
                  <td className="py-3 text-center text-gray-300 tabular-nums">{item.quantidade}</td>
                  <td className="py-3 text-right text-gray-300 tabular-nums">{R$(item.preco_unitario)}</td>
                  <td className="py-3 text-right font-semibold text-white tabular-nums">{R$(item.quantidade * item.preco_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-3 border-t border-white/8 mt-1">
            <span className="text-sm font-bold text-gray-300">Total</span>
            <span className="text-xl font-bold text-brand-500 tabular-nums">{R$(orc.total)}</span>
          </div>
          <div className="px-6 py-3 border-t border-white/6 flex justify-center">
            <span className="text-xs text-gray-600">Powered by </span>
            <Logo size="sm" className="h-4 ml-1 opacity-40" />
          </div>
        </div>
      </div>
{/* Modal Pix */}
      {pixModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2"><QrCode size={18} className="text-orange-400" /> Pix Cobrança</h2>
              <button onClick={() => setPixModal(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
            </div>

            {pixLoading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Spinner size={32} />
                <p className="text-sm text-gray-400">Gerando QR Code...</p>
              </div>
            )}

            {pixErro && !pixLoading && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">{pixErro}</div>
            )}

            {pixData && !pixLoading && (
              <>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Valor a pagar</p>
                  <p className="text-3xl font-black text-orange-400">{R$(pixData.valor)}</p>
                  <p className="text-xs text-gray-600 mt-1">Expira em 30 minutos</p>
                </div>

                {pixData.qr_code_base64 && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code Pix"
                      className="w-48 h-48 rounded-xl border border-white/10"
                    />
                  </div>
                )}

                {pixData.pix_copia_e_cola && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500">Pix Copia e Cola</p>
                    <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                      <p className="text-xs text-gray-400 break-all flex-1 font-mono leading-relaxed">
                        {pixData.pix_copia_e_cola.slice(0, 60)}...
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(pixData.pix_copia_e_cola)}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 text-center">
                  ✓ Após o pagamento, atualize o status do orçamento para "Aprovado"
                </div>
              </>
            )}

            <Btn variant="secondary" full onClick={() => setPixModal(false)}>Fechar</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Público (aprovação) ──────────────────────────────────────────────────────
export function OrcamentoPublico({ id }: { id: string }) {
  const [orc, setOrc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState('')

  useEffect(() => {
    getOrcamento(id).then(({ data }) => { setOrc(data); setLoading(false) })
  }, [id])

  async function handleAction(action: 'aprovado' | 'recusado') {
    await salvarOrcamento({ id, status: action })
    setDone(action)
  }

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Spinner size={32} /></div>
  if (!orc) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-500">Orçamento não encontrado.</div>

  const itens = orc.orcamento_itens ?? []

  if (done) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className={`text-5xl mb-4`}>{done === 'aprovado' ? '✅' : '❌'}</div>
        <h1 className="text-xl font-bold text-white mb-2">
          Orçamento {done === 'aprovado' ? 'Aprovado' : 'Recusado'}!
        </h1>
        <p className="text-gray-400 text-sm">
          {done === 'aprovado' ? 'Obrigado! Entraremos em contato em breve.' : 'Entendemos. Qualquer dúvida estamos à disposição.'}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 p-4 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600/20 to-purple-900/30 px-6 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {orc.empresas?.logo_url
                  ? <img src={orc.empresas.logo_url} alt="logo" className="h-10 w-auto object-contain" />
                  : <span className="text-lg font-bold text-white">{orc.empresas?.nome ?? ''}</span>
                }
                {orc.empresas?.logo_url && <p className="text-base font-bold text-white">{orc.empresas?.nome ?? ''}</p>}
              </div>
              <span className="text-xs text-gray-400">Orçamento #{String(orc.numero).padStart(4,'0')}</span>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {(orc.clientes || orc.cliente_nome) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Para</p>
                <p className="font-bold text-white">{orc.clientes?.nome ?? orc.cliente_nome}</p>
                {orc.condicao_pagamento && <p className="text-sm text-brand-500 mt-0.5">{orc.condicao_pagamento}</p>}
              </div>
            )}
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 border-b border-white/8">
                <th className="text-left pb-2">Descrição</th>
                <th className="text-center pb-2 w-12">Qtd</th>
                <th className="text-right pb-2 w-24">Unit.</th>
                <th className="text-right pb-2 w-24">Total</th>
              </tr></thead>
              <tbody>
                {itens.map((it: any) => (
                  <tr key={it.id} className="border-b border-white/5">
                    <td className="py-2 text-gray-200">{it.descricao}</td>
                    <td className="py-2 text-center text-gray-400 tabular-nums">{it.quantidade}</td>
                    <td className="py-2 text-right text-gray-300 tabular-nums">{R$(it.preco_unitario)}</td>
                    <td className="py-2 text-right font-semibold text-white tabular-nums">{R$(it.quantidade * it.preco_unitario)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3} className="text-right font-bold text-white pt-3">Total</td>
                <td className="text-right font-bold text-brand-500 pt-3 tabular-nums">{R$(orc.total)}</td>
              </tr></tfoot>
            </table>

            {(orc.status === 'enviado' || orc.status === 'rascunho') && (
              <div className="flex gap-3 pt-2 border-t border-white/6">
                <Btn variant="danger" full onClick={() => handleAction('recusado')}>Recusar</Btn>
                <Btn variant="success" full onClick={() => handleAction('aprovado')}>✓ Aprovar Orçamento</Btn>
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-white/6 flex justify-center">
            <span className="text-xs text-gray-600">Powered by </span>
            <Logo size="sm" className="h-4 ml-1 opacity-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
