// ─── Formatação ───────────────────────────────────────────────────────────────
export const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
export const fmtData = (s: string) => new Date(s).toLocaleDateString('pt-BR')
export const hoje = () => new Date().toISOString().split('T')[0]

// ─── Máscaras ─────────────────────────────────────────────────────────────────
export function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskCPFCNPJ(v: string) {
  const digits = v.replace(/\D/g, '')
  return digits.length <= 11 ? maskCPF(digits) : maskCNPJ(digits)
}

export function maskTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, '$1-$2')
}

// ─── CEP ──────────────────────────────────────────────────────────────────────
export async function buscaCEP(cep: string) {
  const c = cep.replace(/\D/g, '')
  if (c.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    const d = await r.json()
    if (d.erro) return null
    return { logradouro: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }
  } catch { return null }
}

// ─── Cálculos ─────────────────────────────────────────────────────────────────
export const calcItem = (qty: number, price: number) => qty * price

export function calcTotais(itens: { quantidade: number; preco_unitario: number }[], desconto: number, frete: number) {
  const subtotal = itens.reduce((s, i) => s + calcItem(i.quantidade, i.preco_unitario), 0)
  const descontoVal = subtotal * (desconto / 100)
  const total = subtotal - descontoVal + frete
  return { subtotal, descontoVal, total }
}

// ─── Status ───────────────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
  recusado: 'Recusado', cancelado: 'Cancelado', em_analise: 'Em análise',
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
export function enviarWhatsApp(telefone: string | undefined, orcamentoId: string, numero: number, empresa: string) {
  const link = `${window.location.origin}/orcamento-publico/${orcamentoId}`
  const msg = encodeURIComponent(`Olá! Segue o orçamento #${numero} da ${empresa}.\n\nAcesse aqui: ${link}\n\nPode aprovar ou recusar diretamente pelo link.`)
  const tel = telefone ? telefone.replace(/\D/g, '') : ''
  if (tel) {
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
  } else {
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
export async function gerarPDF(orc: any, empresa: any, itens: any[]) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, pL = 15, pR = 15

  // Format masks
  const cnpj = (empresa?.cnpj ?? '').replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  const tel = (empresa?.telefone ?? '').replace(/\D/g, '')
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')

  // Validade em dias
  const validadeDias = orc.validade
    ? Math.max(0, Math.ceil((new Date(orc.validade).getTime() - Date.now()) / 86400000))
    : null

  // Header escuro
  doc.setFillColor(15, 14, 23)
  doc.rect(0, 0, W, 48, 'F')

  // Logo se existir
  let logoX = pL
  if (empresa?.logo_url) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
        img.src = empresa.logo_url
      })
      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, 'PNG', pL, 8, 18, 18)
        logoX = pL + 22
      }
    } catch {}
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa?.nome ?? 'Empresa', logoX, 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 178, 210)
  if (tel) doc.text(tel, logoX, 22)
  if (cnpj) doc.text(`CNPJ: ${cnpj}`, logoX, 28)

  const emissao = orc.data_emissao ? new Date(orc.data_emissao).toLocaleDateString('pt-BR') : new Date(orc.created_at).toLocaleDateString('pt-BR')
  const validadeStr = validadeDias !== null ? `${validadeDias} dias` : '–'
  doc.text(`Emissão: ${emissao}   Validade: ${validadeStr}   Resp.: ${orc.responsavel ?? 'Departamento Comercial'}`, pL, 40)

  // Badge número
  doc.setFillColor(249, 115, 22)
  doc.roundedRect(W - pR - 35, 8, 35, 22, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('ORÇAMENTO', W - pR - 17.5, 16, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`#${orc.numero}`, W - pR - 17.5, 25, { align: 'center' })

  // Cliente
  let y = 58
  doc.setFillColor(245, 244, 254)
  doc.roundedRect(pL, y, W - pL - pR, 28, 3, 3, 'F')
  doc.setTextColor(100, 98, 150)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', pL + 5, y + 7)
  doc.setTextColor(20, 20, 40)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const clienteNome = (orc as any).clientes?.nome ?? orc.cliente_nome ?? ''
  doc.text(clienteNome, pL + 5, y + 15)
  if (orc.condicao_pagamento) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(249, 115, 22)
    doc.text(orc.condicao_pagamento, pL + 5, y + 22)
  }

  // Tabela itens
  y += 36
  autoTable(doc, {
    startY: y,
    head: [['#', 'Descrição do Produto/Serviço', 'Und', 'Qtd', 'Unit.', 'Total']],
    body: itens.map((it, i) => [
      i + 1,
      it.descricao,
      it.unidade === 'm2' ? 'm²' : it.unidade === 'm3' ? 'm³' : it.unidade,
      it.quantidade,
      R$(it.preco_unitario),
      R$(it.quantidade * it.preco_unitario),
    ]),
    foot: [['', '', '', '', 'TOTAL', R$(orc.total)]],
    styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
    headStyles: { fillColor: [26, 24, 41], textColor: [180, 178, 210], fontStyle: 'bold' },
    footStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 8 }, 2: { cellWidth: 12 }, 3: { cellWidth: 12 }, 4: { cellWidth: 25 }, 5: { cellWidth: 28 } },
    margin: { left: pL, right: pR },
  })

  // Link aprovação
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const approvalLink = `${window.location.origin}/orcamento-publico/${orc.id}`
  doc.setFontSize(8)
  doc.setTextColor(100, 98, 150)
  doc.text('Link para aprovação online:', pL, finalY)
  doc.setTextColor(249, 115, 22)
  doc.textWithLink(approvalLink, pL, finalY + 6, { url: approvalLink })

  doc.save(`Orcamento_${orc.numero}.pdf`)
}

// ─── PDF Relatório Dashboard ───────────────────────────────────────────────────
export async function gerarRelatorioPDF(
  empresa: any,
  orcamentos: any[],
  periodo: string,
  kpis: { receitaAprovada: number; totalEmitido: number; conversao: number; aprovados: number; pendentes: number; total: number }
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, pL = 15, pR = 15
  const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  // ─ Header
  doc.setFillColor(15, 14, 23)
  doc.rect(0, 0, W, 44, 'F')

  let logoX = pL
  if (empresa?.logo_url) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; img.src = empresa.logo_url })
      if (img.complete && img.naturalWidth > 0) { doc.addImage(img, 'PNG', pL, 8, 16, 16); logoX = pL + 20 }
    } catch {}
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa?.nome ?? 'Empresa', logoX, 16)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 178, 210)
  doc.text(`Relatório de Desempenho · Período: ${periodo}`, logoX, 23)
  doc.text(`Gerado em ${now}`, logoX, 29)

  // Badge relatório
  doc.setFillColor(249, 115, 22)
  doc.roundedRect(W - pR - 30, 10, 30, 16, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO', W - pR - 15, 17, { align: 'center' })
  doc.setFontSize(9)
  doc.text(periodo.toUpperCase(), W - pR - 15, 23, { align: 'center' })

  // ─ KPIs em grid 2x2
  let y = 52
  const kpiItems = [
    { label: 'Receita Aprovada', value: R$(kpis.receitaAprovada), color: [34, 197, 94] as [number,number,number] },
    { label: 'Total Emitido', value: R$(kpis.totalEmitido), color: [249, 115, 22] as [number,number,number] },
    { label: 'Taxa de Conversão', value: `${kpis.conversao}%`, color: [59, 130, 246] as [number,number,number] },
    { label: 'Propostas no Período', value: String(kpis.total), color: [168, 85, 247] as [number,number,number] },
  ]

  const boxW = (W - pL - pR - 6) / 2
  kpiItems.forEach((k, i) => {
    const x = pL + (i % 2) * (boxW + 6)
    const yy = y + Math.floor(i / 2) * 28

    doc.setFillColor(245, 244, 254)
    doc.roundedRect(x, yy, boxW, 24, 3, 3, 'F')

    doc.setFillColor(...k.color)
    doc.roundedRect(x, yy, 4, 24, 2, 2, 'F')

    doc.setTextColor(...k.color)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 8, yy + 11)

    doc.setTextColor(100, 98, 150)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(k.label, x + 8, yy + 19)
  })

  // ─ Mini gráfico de barras (últimos 30 dias)
  y += 62
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 40)
  doc.text('Volume de Orçamentos — últimos 30 dias', pL, y)
  y += 4

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const ds = d.toDateString()
    return orcamentos.filter(o => new Date(o.created_at).toDateString() === ds).length
  })
  const maxVal = Math.max(...chartData, 1)
  const barMaxH = 18
  const barW = (W - pL - pR) / 30

  chartData.forEach((v, i) => {
    const barH = Math.max((v / maxVal) * barMaxH, 0.5)
    const x = pL + i * barW
    if (v > 0) {
      doc.setFillColor(249, 115, 22)
    } else {
      doc.setFillColor(230, 228, 240)
    }
    doc.rect(x + 0.5, y + barMaxH - barH, barW - 1, barH, 'F')
  })

  // Eixo X — início e fim
  y += barMaxH + 2
  doc.setFontSize(7)
  doc.setTextColor(150, 148, 180)
  doc.setFont('helvetica', 'normal')
  const d0 = new Date(); d0.setDate(d0.getDate() - 29)
  doc.text(d0.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), pL, y + 4)
  doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), W - pR, y + 4, { align: 'right' })

  // ─ Tabela de orçamentos do período
  y += 10
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 40)
  doc.text(`Orçamentos do período (${orcamentos.length})`, pL, y)

  const STATUS_PT: Record<string, string> = {
    rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
    recusado: 'Recusado', cancelado: 'Cancelado', em_analise: 'Em análise',
  }

  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Cliente', 'Data', 'Status', 'Total']],
    body: orcamentos.map(o => [
      `#${String(o.numero).padStart(4, '0')}`,
      (o.clientes?.nome ?? o.cliente_nome ?? '–').slice(0, 30),
      new Date(o.created_at).toLocaleDateString('pt-BR'),
      STATUS_PT[o.status] ?? o.status,
      R$(o.total),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 24, 41], textColor: [180, 178, 210], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 18 },
      2: { cellWidth: 22 },
      3: { cellWidth: 24 },
      4: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: pL, right: pR },
    alternateRowStyles: { fillColor: [248, 247, 255] },
  })

  // ─ Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(180, 178, 210)
    doc.text(`${empresa?.nome ?? ''} · Proposta Exata · propostaexata.com.br`, pL, 292)
    doc.text(`Pág. ${i}/${pageCount}`, W - pR, 292, { align: 'right' })
  }

  doc.save(`Relatorio_${periodo.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`)
}
