export type Screen = 
  | 'dashboard' | 'orcamentos' | 'orcamento-novo' | 'orcamento-detalhe' | 'orcamento-publico'
  | 'clientes' | 'cliente-novo'
  | 'produtos'
  | 'recibos' | 'recibo-novo'
  | 'estoque'
  | 'equipe'
  | 'relatorios'
  | 'pagamentos'
  | 'configuracoes'

export type Theme = 'dark' | 'light'

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'cancelado' | 'em_analise'
