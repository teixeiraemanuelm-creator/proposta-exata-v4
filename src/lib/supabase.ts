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

// Empresa
export const getEmpresa = async (userId: string) => {
  const { data } = await supabase.from('user_empresas').select('empresa_id, empresas(*)').eq('user_id', userId).eq('ativo', true).single()
  return (data as any)?.empresas ?? null
}

export const criarEmpresa = async (dados: any, userId: string) => {
  const { data: emp } = await supabase.from('empresas').insert({ ...dados, owner_id: userId }).select().single()
  if (!emp) return null
  await supabase.from('user_empresas').insert({ user_id: userId, empresa_id: emp.id, role: 'admin' })
  return emp
}

export const salvarEmpresa = (id: string, dados: any) =>
  supabase.from('empresas').update(dados).eq('id', id).select().single()

// Clientes
export const getClientes = (empresaId: string) =>
  supabase.from('clientes').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome')

export const salvarCliente = (dados: any) => {
  // Clean and validate required fields
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

// Produtos
export const getProdutos = (empresaId: string) =>
  supabase.from('produtos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome')

export const salvarProduto = (dados: any) =>
  dados.id
    ? supabase.from('produtos').update({ ...dados, updated_at: new Date().toISOString() }).eq('id', dados.id).select().single()
    : supabase.from('produtos').insert(dados).select().single()

export const deletarProduto = (id: string) =>
  supabase.from('produtos').update({ ativo: false }).eq('id', id)

// Orçamentos
export const getOrcamentos = (empresaId: string) =>
  supabase.from('orcamentos').select('*, clientes(nome, telefone, email, cpf_cnpj)').eq('empresa_id', empresaId).order('created_at', { ascending: false })

export const getOrcamento = (id: string) =>
  supabase.from('orcamentos').select('*, clientes(*), orcamento_itens(*)').eq('id', id).single()

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

// Recibos
export const getRecibos = (empresaId: string) =>
  supabase.from('recibos').select('*, clientes(nome)').eq('empresa_id', empresaId).order('created_at', { ascending: false })

export const salvarRecibo = (dados: any) =>
  dados.id
    ? supabase.from('recibos').update(dados).eq('id', dados.id).select().single()
    : supabase.from('recibos').insert(dados).select().single()

export const deletarRecibo = (id: string) =>
  supabase.from('recibos').delete().eq('id', id)

// Sellers/Equipe
export const getVendedores = () =>
  supabase.from('sellers').select('*').eq('active', true).order('name')

export const salvarVendedor = (dados: any) =>
  dados.id
    ? supabase.from('sellers').update(dados).eq('id', dados.id).select().single()
    : supabase.from('sellers').insert(dados).select().single()

export const deletarVendedor = (id: string) =>
  supabase.from('sellers').update({ active: false }).eq('id', id)

// Formas de pagamento
export const getFormasPagamento = () =>
  supabase.from('payment_methods').select('*').order('name')

export const salvarFormaPagamento = (dados: any) =>
  dados.id
    ? supabase.from('payment_methods').update(dados).eq('id', dados.id).select().single()
    : supabase.from('payment_methods').insert(dados).select().single()

export const deletarFormaPagamento = (id: string) =>
  supabase.from('payment_methods').delete().eq('id', id)

// Estoque
export const getEstoque = () =>
  supabase.from('stock').select('*, products(name, unit, code)').order('updated_at', { ascending: false })

export const getMovimentacoes = () =>
  supabase.from('stock_movements').select('*, products(name)').order('created_at', { ascending: false })
