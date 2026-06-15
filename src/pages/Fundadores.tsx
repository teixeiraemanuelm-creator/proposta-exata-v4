import { useState, useEffect } from 'react'
import { CheckCircle2, Star, X, ArrowRight, Crown, Zap, FileText, Send, ThumbsUp, Clock, Shield, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'
import { Spinner } from '@/components/ui'

const VALOR_LIFETIME = 1500
const VALOR_PRO = 47

// ─── Checkout Pix genérico ────────────────────────────────────────────────────
function CheckoutPix({
  titulo, valor, descricao, tipo, onClose, onSuccess
}: {
  titulo: string
  valor: number
  descricao: string
  tipo: 'lifetime' | 'pro'
  onClose: () => void
  onSuccess: () => void
}) {
  const [pixData, setPixData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'pix' | 'sucesso'>('email')

  async function gerarPix() {
    if (!email || !email.includes('@')) { setErro('Digite um email válido'); return }
    setLoading(true)
    setErro('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-pix`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            valor,
            descricao,
            email,
            nome: email.split('@')[0],
            cpf: '00000000000',
            orcamento_id: `${tipo}-${Date.now()}`,
            numero: tipo.toUpperCase(),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErro(data.erro ?? 'Erro ao gerar Pix')
      } else {
        setPixData(data)
        setStep('pix')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  async function confirmar() {
    setConfirmando(true)
    // Registra o interesse — quando fizer login o sistema ativa o plano
    try {
      await supabase.from('pagamentos_assinatura').insert({
        mp_payment_id: pixData?.payment_id ?? `manual-${Date.now()}`,
        email,
        tipo,
        valor,
        status: 'pending_confirmation',
        metodo: 'pix',
        payload: { email, tipo, pixData },
      })
    } catch { /* silencioso */ }

    // Google Ads — conversão de compra
    if (typeof (window as any).gtag === 'function') {
      ;(window as any).gtag('event', 'conversion', {
        send_to: 'AW-18242129357/gT23COzE3L8cEM2bw_pD',
        value: valor,
        currency: 'BRL',
        transaction_id: pixData?.payment_id ?? `manual-${Date.now()}`,
      })
    }

    setStep('sucesso')
    setConfirmando(false)
    setTimeout(() => onSuccess(), 2500)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#13121f] border border-white/10 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 my-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-sm flex items-center gap-2">
            {tipo === 'lifetime' ? <Star size={16} className="text-orange-400" /> : <Crown size={16} className="text-orange-400" />}
            {titulo}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">{tipo === 'lifetime' ? 'Pagamento único' : 'Mensal'}</p>
          <p className="text-3xl font-black text-white">R$ {valor.toLocaleString('pt-BR')}</p>
          {tipo === 'lifetime' && <p className="text-xs text-gray-500 mt-1">sem mensalidade para sempre</p>}
          {tipo === 'pro' && <p className="text-xs text-gray-500 mt-1">cancele quando quiser</p>}
        </div>

        {step === 'sucesso' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-black text-white mb-1">Pagamento registrado!</p>
              <p className="text-xs text-gray-400">Crie sua conta em propostaexata.com.br e seu plano será ativado em até 1 hora.</p>
              <p className="text-xs text-gray-500 mt-2">Dúvidas: (16) 99116-9184</p>
            </div>
          </div>
        )}

        {step === 'email' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Seu email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input w-full"
              />
              <p className="text-xs text-gray-600">Use o mesmo email para criar sua conta depois</p>
            </div>
            {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
            <button
              onClick={gerarPix}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner size={18} /> : <><ArrowRight size={15} /> Gerar QR Code Pix</>}
            </button>
          </>
        )}

        {step === 'pix' && pixData && (
          <>
            {pixData.qr_code_base64 && (
              <div className="flex justify-center">
                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-44 h-44 rounded-xl border border-white/10" />
              </div>
            )}
            {pixData.pix_copia_e_cola && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-500">Pix Copia e Cola</p>
                <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                  <p className="text-xs text-gray-400 font-mono flex-1 truncate">{pixData.pix_copia_e_cola.slice(0, 38)}...</p>
                  <button onClick={() => navigator.clipboard.writeText(pixData.pix_copia_e_cola)} className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex-shrink-0">Copiar</button>
                </div>
              </div>
            )}
            {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
            <button
              onClick={confirmar}
              disabled={confirmando}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {confirmando ? <Spinner size={18} /> : '✓ Já paguei — Confirmar'}
            </button>
            <p className="text-xs text-gray-600 text-center">Clique após confirmar o pagamento no banco</p>
          </>
        )}
      </div>
    </div>
  )
}


// ─── Contador regressivo ──────────────────────────────────────────────────────
function Countdown() {
  const deadline = new Date('2026-07-15T23:59:59')
  const [diff, setDiff] = useState(deadline.getTime() - Date.now())

  useEffect(() => {
    const t = setInterval(() => setDiff(deadline.getTime() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const Cell = ({ n, l }: { n: number; l: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black text-white tabular-nums w-10 text-center">{String(n).padStart(2, '0')}</span>
      <span className="text-[10px] text-gray-600 uppercase tracking-wide">{l}</span>
    </div>
  )

  return (
    <div className="flex items-center gap-1">
      <Cell n={d} l="dias" />
      <span className="text-gray-600 font-bold mb-3">:</span>
      <Cell n={h} l="horas" />
      <span className="text-gray-600 font-bold mb-3">:</span>
      <Cell n={m} l="min" />
      <span className="text-gray-600 font-bold mb-3">:</span>
      <Cell n={s} l="seg" />
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/6 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown size={16} className={`text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-400 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

// ─── Página Fundadores ────────────────────────────────────────────────────────
export function PaginaFundadores() {
  const [checkout, setCheckout] = useState<'lifetime' | 'pro' | null>(null)
  const [sucesso, setSucesso] = useState<'lifetime' | 'pro' | null>(null)
  const [vagasRestantes] = useState(17)

  const beneficiosLifetime = [
    'Acesso vitalício ao Pro — sem mensalidade jamais',
    'Todas as atualizações futuras inclusas',
    'Badge exclusivo "Fundador" no app',
    'Suporte prioritário via WhatsApp',
    'Voto em novas funcionalidades',
    'Acesso antecipado a novidades',
  ]

  const beneficiosPro = [
    'Orçamentos ilimitados',
    'Até 5 usuários na equipe',
    'PDF com logo da empresa',
    'Relatórios avançados',
    'Cancele quando quiser',
  ]

  const faqs = [
    { q: 'Preciso ter CNPJ para assinar?', a: 'Não. O Proposta Exata funciona para autônomos, MEI e empresas. Qualquer prestador de serviço pode usar — elétrica, pintura, reforma, consultoria, design, e muito mais.' },
    { q: 'Como funciona o pagamento via Pix?', a: 'Clique no botão do plano desejado, informe seu email, e um QR Code Pix é gerado na hora. Após o pagamento, clique em "Já paguei". Crie sua conta usando o mesmo email — o plano é ativado automaticamente em até 5 minutos.' },
    { q: 'O que é a licença Fundador Vitalícia?', a: 'É um pagamento único de R$ 1.500 que garante acesso ao plano Pro para sempre, sem nenhuma mensalidade. São apenas 20 vagas no total — para quem acredita no produto desde o início.' },
    { q: 'Posso cancelar o plano Pro mensal?', a: 'Sim, quando quiser, sem burocracia. O cancelamento é feito diretamente dentro do app, na tela de Plano & Assinatura.' },
    { q: 'Meus dados ficam salvos se eu cancelar?', a: 'Sim. Seus orçamentos, clientes e produtos ficam salvos. Você só perde o acesso às funcionalidades Pro, voltando para os limites do plano Free.' },
    { q: 'O cliente precisa baixar algum app para ver o orçamento?', a: 'Não. O cliente recebe um link pelo WhatsApp e abre o orçamento no navegador, sem precisar criar conta nem instalar nada.' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 max-w-5xl mx-auto w-full">
        <Logo />
        <button
          onClick={() => setCheckout('pro')}
          className="text-xs font-bold text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors"
        >
          Assinar Pro — R$ 47/mês
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-5">

        {/* HERO */}
        <div className="w-full max-w-3xl flex flex-col items-center text-center pt-14 pb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-semibold text-orange-400">
              Apenas {vagasRestantes} vagas de Fundador restantes
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Seu orçamento no WhatsApp<br />
            <span className="text-orange-400">em menos de 3 minutos.</span>
          </h1>

          <p className="text-gray-400 text-lg mb-4 max-w-xl">
            Para eletricistas, pintores, reformas, freelancers e pequenas empresas que perdem cliente por mandar orçamento feio no papel ou no Word.
          </p>

          <p className="text-sm text-gray-600 mb-8">Mais de 40 profissionais já testaram na fase beta.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCheckout('lifetime')}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-7 py-4 rounded-xl transition-all text-sm"
              style={{ boxShadow: '0 0 30px rgba(249,115,22,0.35)' }}
            >
              <Star size={15} /> Garantir vaga de Fundador — R$ 1.500
            </button>
            <button
              onClick={() => setCheckout('pro')}
              className="flex items-center justify-center gap-2 border border-white/15 text-white font-bold px-7 py-4 rounded-xl hover:bg-white/5 transition-colors text-sm"
            >
              Assinar Pro — R$ 47/mês
            </button>
          </div>
          <p className="text-xs text-gray-700 mt-4">Pix. Sem cartão. Ativação automática.</p>
        </div>

        {/* MOCK DO APP */}
        <div className="w-full max-w-2xl mb-16">
          <div className="bg-[#13121f] border border-white/8 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-xs text-gray-600 ml-2">propostaexata.com.br/app</span>
            </div>
            <div className="bg-[#0f0e17] rounded-xl p-4 border border-white/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Orçamento #047</p>
                  <p className="font-black text-white">Instalação Elétrica Residencial</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cliente: João da Silva</p>
                </div>
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full font-bold">Enviado</span>
              </div>
              <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                {[
                  { d: 'Quadro elétrico 24 disjuntores', v: 'R$ 850,00' },
                  { d: 'Cabeamento (150m) + tomadas', v: 'R$ 420,00' },
                  { d: 'Mão de obra (2 dias)', v: 'R$ 680,00' },
                ].map(item => (
                  <div key={item.d} className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{item.d}</p>
                    <p className="text-xs font-semibold text-white">{item.v}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 mt-3 pt-3 flex items-center justify-between">
                <p className="text-sm font-black text-white">Total</p>
                <p className="text-xl font-black text-orange-400">R$ 1.950,00</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 flex items-center gap-1.5 bg-green-600/15 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg justify-center">
                <Send size={11} /> Enviar no WhatsApp
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-white/5 border border-white/8 text-gray-400 text-xs font-semibold px-3 py-2 rounded-lg justify-center">
                <FileText size={11} /> Baixar PDF
              </div>
            </div>
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <div className="w-full max-w-3xl mb-16">
          <h2 className="text-2xl font-black text-white text-center mb-8">Como funciona?</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: <FileText size={22} className="text-orange-400" />, t: 'Monte o orçamento', d: 'Adicione itens, quantidades e valores. O total é calculado automaticamente.' },
              { icon: <Send size={22} className="text-orange-400" />, t: 'Envie pelo WhatsApp', d: 'Um link profissional chega para o cliente em segundos. Sem PDF por email, sem papel.' },
              { icon: <ThumbsUp size={22} className="text-orange-400" />, t: 'Receba a aprovação', d: 'O cliente aprova direto pelo link. Você é notificado na hora.' },
            ].map(s => (
              <div key={s.t} className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">{s.icon}</div>
                <p className="font-black text-white">{s.t}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PLANOS */}
        <div className="w-full max-w-3xl mb-6">
          <h2 className="text-2xl font-black text-white text-center mb-2">Escolha seu plano</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Oferta de lançamento — preços sobem após as 20 vagas Fundador</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Pro Mensal */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-gray-400" />
                <p className="font-bold text-gray-300 text-sm">Pro Mensal</p>
              </div>
              <p className="text-4xl font-black text-white mb-1">R$ 47<span className="text-sm font-normal text-gray-500">/mês</span></p>
              <p className="text-xs text-gray-600 mb-5">cancele quando quiser</p>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {beneficiosPro.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 size={14} className="text-gray-500 flex-shrink-0 mt-0.5" /> {b}
                  </li>
                ))}
              </ul>
              {sucesso === 'pro' ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold text-center">✓ Pagamento confirmado!</div>
              ) : (
                <button onClick={() => setCheckout('pro')} className="w-full py-3 rounded-xl border border-white/15 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                  Assinar Pro
                </button>
              )}
            </div>

            {/* Fundador Lifetime */}
            <div className="border border-orange-500/40 rounded-2xl p-6 flex flex-col relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(15,14,23,1) 60%)', boxShadow: '0 0 50px rgba(249,115,22,0.15)' }}>
              <div className="absolute top-4 right-4">
                <span className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-full font-bold">{vagasRestantes} vagas</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-orange-400" />
                <p className="font-bold text-white text-sm">Fundador Vitalício</p>
              </div>
              <p className="text-4xl font-black text-white mb-1">R$ 1.500<span className="text-sm font-normal text-gray-500"> único</span></p>
              <p className="text-xs text-gray-500 mt-1 mb-2">equivale a 32 meses de Pro — para sempre</p>
              <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-2 mb-4">
                <p className="text-xs text-orange-300/80 text-center">⚡ Oferta encerra em:</p>
                <div className="flex justify-center mt-1"><Countdown /></div>
              </div>
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {beneficiosLifetime.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 size={14} className="text-orange-500 flex-shrink-0 mt-0.5" /> {b}
                  </li>
                ))}
              </ul>
              {sucesso === 'lifetime' ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold text-center">✓ Seja bem-vindo, Fundador!</div>
              ) : (
                <button
                  onClick={() => setCheckout('lifetime')}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm transition-all"
                  style={{ boxShadow: '0 0 20px rgba(249,115,22,0.35)' }}
                >
                  <Star size={14} className="inline mr-1.5" />
                  Garantir vaga de Fundador
                </button>
              )}
            </div>
          </div>
        </div>

        {/* GARANTIA */}
        <div className="w-full max-w-3xl mb-14">
          <div className="flex items-start gap-4 bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-black text-white mb-1">Garantia de 7 dias</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Não gostou? Mande uma mensagem no WhatsApp em até 7 dias e devolvemos 100% do valor. Sem perguntas, sem burocracia.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="w-full max-w-2xl mb-14">
          <h2 className="text-2xl font-black text-white text-center mb-6">Perguntas frequentes</h2>
          <div className="bg-white/3 border border-white/8 rounded-2xl px-5">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* CTA FINAL */}
        <div className="w-full max-w-3xl mb-16 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Pronto para mandar orçamentos profissionais?</h2>
          <p className="text-gray-500 text-sm mb-6">Comece hoje. Configure em minutos. Sem contrato.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setCheckout('lifetime')}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-7 py-4 rounded-xl transition-all text-sm"
              style={{ boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}
            >
              <Star size={15} /> Fundador Vitalício — R$ 1.500
            </button>
            <button
              onClick={() => setCheckout('pro')}
              className="flex items-center justify-center gap-2 border border-white/15 text-white font-bold px-7 py-4 rounded-xl hover:bg-white/5 transition-colors text-sm"
            >
              Pro Mensal — R$ 47/mês
            </button>
          </div>
          <p className="text-xs text-gray-700 mt-4">Pix. Ativação automática. Garantia de 7 dias.</p>
        </div>

        {/* Footer */}
        <div className="text-center pb-10 border-t border-white/5 pt-8 w-full max-w-3xl">
          <p className="text-xs text-gray-600 mb-3">Dúvidas? Fale diretamente com a equipe</p>
          <a href="https://wa.me/5516991169184" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-600/30 transition-colors">
            WhatsApp (16) 99116-9184
          </a>
          <p className="text-xs text-gray-700 mt-4">CDD Tech Solutions · Ribeirão Preto, SP</p>
        </div>
      </div>

      {checkout && (
        <CheckoutPix
          titulo={checkout === 'lifetime' ? 'Licença Fundador Vitalícia' : 'Plano Pro Mensal'}
          valor={checkout === 'lifetime' ? VALOR_LIFETIME : VALOR_PRO}
          descricao={checkout === 'lifetime' ? 'Proposta Exata — Licença Vitalícia Fundador' : 'Proposta Exata Pro — Assinatura Mensal'}
          tipo={checkout}
          onClose={() => setCheckout(null)}
          onSuccess={() => { setSucesso(checkout); setCheckout(null) }}
        />
      )}
    </div>
  )
}

// ─── Badge Fundador ────────────────────────────────────────────────────────────
export function BadgeFundador() {
  return (
    <span className="inline-flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
      <Star size={8} /> Fundador
    </span>
  )
}
