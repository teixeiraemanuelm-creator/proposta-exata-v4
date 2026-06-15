import { useState } from 'react'
import { CheckCircle2, Star, X, ArrowRight, Crown, Zap } from 'lucide-react'
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

// ─── Página Fundadores ────────────────────────────────────────────────────────
export function PaginaFundadores() {
  const [checkout, setCheckout] = useState<'lifetime' | 'pro' | null>(null)
  const [sucesso, setSucesso] = useState<'lifetime' | 'pro' | null>(null)

  const beneficiosLifetime = [
    'Acesso vitalício ao Pro — sem mensalidade',
    'Todas as atualizações futuras incluídas',
    'Acesso antecipado 15 dias antes do lançamento',
    'Badge exclusivo "Fundador" no app',
    'Suporte prioritário via WhatsApp',
    'Voto em novas funcionalidades',
    '1 usuário por licença',
  ]

  const beneficiosPro = [
    'Orçamentos ilimitados',
    'Até 5 usuários na equipe',
    'PDF com logo da empresa',
    'Relatórios avançados',
    'Cancele quando quiser',
  ]

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-6 py-5 border-b border-white/6">
        <Logo />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-8">
          <Star size={13} className="text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">Oferta de lançamento — Apenas 20 vagas</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 text-center max-w-xl leading-tight">
          Orçamentos profissionais.<br />
          <span className="text-orange-400">Aprovados pelo WhatsApp.</span>
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-lg">
          Crie, envie e receba aprovação do cliente em minutos. Escolha o plano ideal para você.
        </p>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-2xl mb-12">

          {/* Pro Mensal */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-gray-400" />
              <p className="font-bold text-gray-300">Pro Mensal</p>
            </div>
            <p className="text-3xl font-black text-white mb-1">R$ 47<span className="text-sm font-normal text-gray-500">/mês</span></p>
            <p className="text-xs text-gray-600 mb-5">cancele quando quiser</p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {beneficiosPro.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle2 size={13} className="text-gray-600 flex-shrink-0 mt-0.5" /> {b}
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
          <div className="border border-orange-500/40 rounded-2xl p-6 flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(15,14,23,1) 60%)', boxShadow: '0 0 40px rgba(249,115,22,0.12)' }}>
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-full font-bold">20 vagas</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-orange-400" />
              <p className="font-bold text-white">Fundador Vitalício</p>
            </div>
            <p className="text-3xl font-black text-white mb-1">R$ 1.500<span className="text-sm font-normal text-gray-500"> único</span></p>
            <p className="text-xs text-gray-500 mb-5">sem mensalidade — para sempre</p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {beneficiosLifetime.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
            {sucesso === 'lifetime' ? (
              <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold text-center">✓ Seja bem-vindo, Fundador!</div>
            ) : (
              <button
                onClick={() => setCheckout('lifetime')}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm transition-all"
                style={{ boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}
              >
                <Star size={14} className="inline mr-1.5" />
                Garantir vaga de Fundador
              </button>
            )}
          </div>
        </div>

        {/* Como funciona */}
        <div className="w-full max-w-2xl bg-white/3 border border-white/8 rounded-2xl p-6 mb-8">
          <h3 className="font-black text-white mb-4 text-center">Como funciona?</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {[
              { n: '1', t: 'Escolha o plano', d: 'Fundador ou Pro mensal' },
              { n: '2', t: 'Pague via Pix', d: 'QR Code gerado na hora' },
              { n: '3', t: 'Crie sua conta', d: 'Use o mesmo email do pagamento' },
            ].map(s => (
              <div key={s.n} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center">{s.n}</div>
                <p className="font-semibold text-white text-sm">{s.t}</p>
                <p className="text-xs text-gray-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-3">Dúvidas? Fale com a gente</p>
          <a href="https://wa.me/5516991169184" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-600/30 transition-colors">
            WhatsApp (16) 99116-9184
          </a>
          <p className="text-xs text-gray-700 mt-4">
            Após o pagamento, crie sua conta em{' '}
            <a href="https://propostaexata.com.br/app" className="text-orange-400 hover:underline">propostaexata.com.br/app</a>
          </p>
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
