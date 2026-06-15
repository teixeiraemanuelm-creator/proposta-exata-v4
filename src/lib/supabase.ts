import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Auth
export const signInEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signOut = () => supabase.auth.signOut()

// Empresa — agora retorna também o role do usuário
export const getEmpresa = async (userId: string) => {
  const { data } = await supabase
    .from('user_empresas')
    .select('empresa_id, role, empresas(*)')
    .eq('user_id', userId)
    .eq('ativo', true)
    .single()
  if (!data) return null
  return { empresa: (data as any).empresas ?? null, role: (data as any).role ?? 'vendedor' }
}

export const criarEmpresa = async (dados: any, userId: string) => {
  const { data: emp } = await supabase.from('empresas').insert({ ...dados, owner_id: userId }).select().single()
  if (!emp) return null
  await supabase.from('user_empresas').insert({ user_id: userId, empresa_id: emp.id, role: 'owner' })
  return emp
}

export const salvarEmpresa = (id: string, dados: any) =>
  supabase.from('empresas').update(dados).eq('id', id).select().single()

// ─── Membros da equipe (multiusuário) ─────────────────────────────────────────

export const getMembros = (empresaId: string) =>
  supabase
    .from('user_empresas')
    .select('id, user_id, role, ativo, created_at, auth_users:user_id(email, raw_user_meta_data)')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('created_at')

export const atualizarRoleMembro = (id: string, role: string) =>
  supabase.from('user_empresas').update({ role }).eq('id', id)

export const removerMembro = (id: string) =>
  supabase.from('user_empresas').update({ ativo: false }).eq('id', id)

// ─── Convites ─────────────────────────────────────────────────────────────────

export const getConvites = (empresaId: string) =>
  supabase
    .from('convites')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('aceito', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

export const criarConvite = (empresaId: string, email: string, role: string, convidadoPor: string) =>
  supabase.from('convites').insert({
    empresa_id: empresaId,
    email: email.toLowerCase().trim(),
    role,
    convidado_por: convidadoPor,
  }).select().single()

export const cancelarConvite = (id: string) =>
  supabase.from('convites').delete().eq('id', id)

export const aceitarConvite = (token: string) =>
  supabase.rpc('aceitar_convite', { p_token: token })

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const getClientes = (empresaId: string) =>
  supabase.from('clientes').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome')

export const salvarCliente = (dados: any) => {
  const payload: any = {
    empresa_id: dados.empresa_id,
    tipo: (dados.tipo === 'fisica' || dados.tipo === 'juridica') ? dados.tipo : 'juridica',
    nome: dados.nome?.trim() ?? '',
    empresa: dados.empresa ?? null,
    cpf_cnpj: dados.cpf_cnpj ?? null,
    email: dados.email ?? null,
    telefone: dados.telefone ?? null,
    celular: dados.celular ?? null,
    endereco: dados.endereco ?? null,
    numero: dados.numero ?? null,
    complemento: dados.complemento ?? null,
    bairro: dados.bairro ?? null,
    cidade: dados.cidade ?? null,
    estado: dados.estado ? String(dados.estado).slice(0, 2).toUpperCase() : null,
    cep: dados.cep ?? null,
    observacoes: dados.observacoes ?? null,
    ativo: true,
  }
  if (dados.id) {
    return supabase.from('clientes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', dados.id).select().single()
  }
  return supabase.from('clientes').insert(payload).select().single()
}

export const deletarCliente = (id: string) =>
  supabase.from('clientes').update({ ativo: false }).eq('id', id)

// ─── Produtos ─────────────────────────────────────────────────────────────────
export async function getProximoCodigo(empresaId: string): Promise<string> {
  const { data } = await supabase.from('produtos').select('codigo').eq('empresa_id', empresaId).order('created_at', { ascending: false })
  const codigos = (data ?? []).map((p: any) => p.codigo ?? '').filter((c: string) => /^P-\d+$/.test(c))
  if (codigos.length === 0) return 'P-001'
  const nums = codigos.map((c: string) => parseInt(c.replace('P-', '')))
  const max = Math.max(...nums)
  return `P-${String(max + 1).padStart(3, '0')}`
}

export const getProdutos = (empresaId: string) =>
  supabase.from('produtos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome')

export const salvarProduto = (dados: any) =>
  dados.id
    ? supabase.from('produtos').update({ ...dados, updated_at: new Date().toISOString() }).eq('id', dados.id).select().single()
    : supabase.from('produtos').insert(dados).select().single()

export const deletarProduto = (id: string) =>
  supabase.from('produtos').update({ ativo: false }).eq('id', id)

// ─── Orçamentos ───────────────────────────────────────────────────────────────
export const getOrcamentos = (empresaId: string) =>
  supabase.from('orcamentos').select('*, clientes(nome, telefone, email, cpf_cnpj)').eq('empresa_id', empresaId).order('created_at', { ascending: false })

export const getOrcamento = (id: string) =>
  supabase.from('orcamentos').select('*, clientes(*), orcamento_itens(*), empresas(nome, logo_url, telefone, email)').eq('id', id).single()

export const salvarOrcamento = (dados: any) =>
  dados.id
    ? supabase.from('orcamentos').update({ ...dados, updated_at: new Date().toISOString() }).eq('id', dados.id).select().single()
    : supabase.from('orcamentos').insert(dados).select().single()

export const deletarOrcamento = (id: string) =>
  supabase.from('orcamentos').delete().eq('id', id)

export const salvarItens = async (orcamentoId: string, itens: any[]) => {
  await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamentoId)
  if (itens.length === 0) return
  await supabase.from('orcamento_itens').insert(itens.map((it, i) => ({ ...it, orcamento_id: orcamentoId, ordem: i })))
}

// ─── Recibos ──────────────────────────────────────────────────────────────────
export const getRecibos = (empresaId: string) =>
  supabase.from('recibos').select('*, clientes(nome)').eq('empresa_id', empresaId).order('created_at', { ascending: false })

export const salvarRecibo = (dados: any) =>
  dados.id
    ? supabase.from('recibos').update(dados).eq('id', dados.id).select().single()
    : supabase.from('recibos').insert(dados).select().single()

export const deletarRecibo = (id: string) =>
  supabase.from('recibos').delete().eq('id', id)

// ─── Sellers (legado — mantido para compatibilidade) ──────────────────────────
export const getVendedores = () =>
  supabase.from('sellers').select('*').eq('active', true).order('name')

export const salvarVendedor = (dados: any) =>
  dados.id
    ? supabase.from('sellers').update(dados).eq('id', dados.id).select().single()
    : supabase.from('sellers').insert(dados).select().single()

export const deletarVendedor = (id: string) =>
  supabase.from('sellers').update({ active: false }).eq('id', id)

// ─── Formas de pagamento ──────────────────────────────────────────────────────
export const getFormasPagamento = () =>
  supabase.from('payment_methods').select('*').order('name')

export const salvarFormaPagamento = (dados: any) =>
  dados.id
    ? supabase.from('payment_methods').update(dados).eq('id', dados.id).select().single()
    : supabase.from('payment_methods').insert(dados).select().single()

export const deletarFormaPagamento = (id: string) =>
  supabase.from('payment_methods').delete().eq('id', id)

// ─── Estoque ──────────────────────────────────────────────────────────────────
export const getEstoque = () =>
  supabase.from('stock').select('*, products(name, unit, code)').order('updated_at', { ascending: false })

export const getMovimentacoes = () =>
  supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false })

// ─── Assinaturas ──────────────────────────────────────────────────────────────

export const getAssinatura = (empresaId: string) =>
  supabase.from('assinaturas').select('*').eq('empresa_id', empresaId).single()

export const podecriarOrcamento = (empresaId: string) =>
  supabase.rpc('pode_criar_orcamento', { p_empresa_id: empresaId })

export const getPagamentosAssinatura = (empresaId: string) =>
  supabase.from('pagamentos_assinatura').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(10)

export const ativarPlano = (empresaId: string, mpPaymentId: string) =>
  supabase.from('assinaturas').upsert({
    empresa_id: empresaId,
    plano: 'pro',
    status: 'ativo',
    mp_payment_id: mpPaymentId,
    valor_mensal: 47,
    inicio: new Date().toISOString(),
    proximo_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'empresa_id' })

// Ativação manual de licença Lifetime (Fundadores) — executar via Supabase dashboard ou função admin
// Uso: ativarLifetime(empresaId, 'pix-manual-xxx') -> muda plano para 'lifetime' sem vencimento
export const ativarLifetime = (empresaId: string, pagamentoId: string) =>
  supabase.from('assinaturas').upsert({
    empresa_id: empresaId,
    plano: 'lifetime',
    status: 'ativo',
    mp_payment_id: pagamentoId,
    valor_mensal: 0,
    inicio: new Date().toISOString(),
    proximo_vencimento: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'empresa_id' })
