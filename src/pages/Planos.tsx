import { useState } from 'react'
import { CheckCircle2, Zap, Crown, ArrowRight, X } from 'lucide-react'
import { useAuth } from '@/contexts'
import { supabase, ativarPlano } from '@/lib/supabase'
import { R$ } from '@/lib/utils'
import { Btn, Spinner } from '@/components/ui'

// ─── Gate — bloqueia criação de orçamento no plano free ───────────────────────
export function OrcamentoGate({ onContinue, onUpgrade }: { onContinue: () => void; onUpgrade: () => void }) {
  const { plano, assinatura } = useAuth()
  const usado = assinatura?.orcamentos_mes ?? 0 // será preenchido pela verificação no form

  if (plano === 'pro') {
    onContinue()
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-7 flex flex-col gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mx-auto">
          <Crown size={28} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white mb-2">Limite do plano Free atingido</h2>
          <p className="text-sm text-gray-400">Você usou <strong className="text-white">5 de 5</strong> orçamentos este mês.</p>
          <p className="text-sm text-gray-500 mt-1">Assine o Pro para criar orçamentos ilimitados.</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <p className="text-2xl font-black text-white">R$ 47<span className="text-sm font-normal text-gray-400">/mês</span></p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-left">
            {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
              <li key={f} className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onUpgrade} icon={<Zap size={15} />}>Assinar Pro — R$ 47/mês</Btn>
          <button onClick={onContinue} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            Voltar para orçamentos
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Checkout Pix para assinatura Pro ────────────────────────────────────────
export function CheckoutPro({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { empresa, refreshAssinatura } = useAuth()
  const [step, setStep] = useState<'info' | 'pix' | 'confirmar' | 'sucesso'>('info')
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  async function gerarPix() {
    if (!empresa) return
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
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            valor: 47,
            descricao: 'Proposta Exata Pro — Assinatura Mensal',
            email: session?.user?.email ?? 'cliente@propostaexata.com.br',
            nome: empresa.nome ?? 'Cliente',
            cpf: empresa.cnpj?.replace(/\D/g, '') ?? '00000000000',
            orcamento_id: `assinatura-${empresa.id}-${Date.now()}`,
            numero: 'PRO',
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

  async function confirmarPagamento() {
    if (!empresa || !pixData) return
    setConfirmando(true)
    // Ativa o plano Pro manualmente (em produção seria via webhook automático)
    await ativarPlano(empresa.id, pixData.order_id)
    await refreshAssinatura()
    setStep('sucesso')
    setConfirmando(false)
    setTimeout(() => { onSuccess(); onClose() }, 2500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white flex items-center gap-2">
            <Crown size={18} className="text-orange-400" /> Assinar Pro
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {/* Step: info */}
        {step === 'info' && (
          <>
            <div className="bg-white/3 border border-white/8 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Plano Pro — Mensal</p>
              <p className="text-4xl font-black text-white">R$ 47</p>
              <p className="text-xs text-gray-500 mt-1">cobrado todo mês via Pix</p>
            </div>
            <ul className="flex flex-col gap-2">
              {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
            <Btn full loading={loading} icon={<ArrowRight size={15} />} onClick={gerarPix}>
              Gerar QR Code Pix
            </Btn>
            <p className="text-xs text-gray-600 text-center">Sem contrato. Cancele quando quiser.</p>
          </>
        )}

        {/* Step: pix */}
        {step === 'pix' && pixData && (
          <>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Pague via Pix</p>
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
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-500">Pix Copia e Cola</p>
                <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                  <p className="text-xs text-gray-400 font-mono flex-1 truncate">{pixData.pix_copia_e_cola.slice(0, 40)}...</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(pixData.pix_copia_e_cola)}
                    className="flex-shrink-0 text-xs text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <Btn full loading={confirmando} onClick={confirmarPagamento}>
              ✓ Já paguei — Ativar Pro
            </Btn>
            <p className="text-xs text-gray-600 text-center">
              Clique após confirmar o pagamento no seu banco
            </p>
          </>
        )}

        {/* Step: sucesso */}
        {step === 'sucesso' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Bem-vindo ao Pro!</h3>
              <p className="text-sm text-gray-400">Seu plano foi ativado com sucesso.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tela Planos (acessível pelo menu) ────────────────────────────────────────
export function Planos() {
  const { plano, assinatura, empresa } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  const isPro = plano === 'pro'

  return (
    <div className="w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Plano & Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu plano e histórico de pagamentos</p>
      </div>

      {/* Status atual */}
      <div className={`card p-6 mb-5 border ${isPro ? 'border-orange-500/30' : 'border-white/8'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPro ? 'bg-orange-500/15' : 'bg-white/5'}`}>
              {isPro ? <Crown size={24} className="text-orange-400" /> : <Zap size={24} className="text-gray-500" />}
            </div>
            <div>
              <p className="font-black text-white text-lg">{isPro ? 'Plano Pro' : 'Plano Free'}</p>
              <p className="text-xs text-gray-500">
                {isPro
                  ? `Próximo vencimento: ${assinatura?.proximo_vencimento ? new Date(assinatura.proximo_vencimento).toLocaleDateString('pt-BR') : '–'}`
                  : '5 orçamentos/mês · 1 usuário'
                }
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPro ? 'bg-orange-500/20 text-orange-400' : 'bg-white/8 text-gray-400'}`}>
            {isPro ? 'ATIVO' : 'FREE'}
          </span>
        </div>
      </div>

      {/* Cards de planos */}
      {!isPro && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Free */}
          <div className="card p-6 border border-white/8 opacity-70">
            <p className="text-sm font-semibold text-gray-400 mb-1">Free</p>
            <p className="text-3xl font-black text-white mb-4">R$ 0<span className="text-sm font-normal text-gray-500"> /mês</span></p>
            <ul className="flex flex-col gap-2 mb-5">
              {['5 orçamentos/mês', '1 usuário', 'PDF básico', 'Link de aprovação'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={13} className="text-gray-600 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-gray-600 text-center font-semibold">
              Plano atual
            </div>
          </div>

          {/* Pro */}
          <div className="card p-6 border border-orange-500/40" style={{ boxShadow: '0 0 30px rgba(249,115,22,0.1)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-300">Pro</p>
              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Recomendado</span>
            </div>
            <p className="text-3xl font-black text-white mb-4">R$ 47<span className="text-sm font-normal text-gray-500"> /mês</span></p>
            <ul className="flex flex-col gap-2 mb-5">
              {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Btn full onClick={() => setShowCheckout(true)} icon={<Crown size={14} />}>
              Assinar Pro
            </Btn>
          </div>
        </div>
      )}

      {isPro && (
        <div className="card p-5 border border-emerald-500/20 mb-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">Tudo liberado no Pro</p>
              <p className="text-xs text-gray-500">Orçamentos ilimitados, 5 usuários, PDF com logo e relatórios avançados.</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center">Dúvidas? Fale conosco pelo WhatsApp: (16) 99116-9184</p>

      {showCheckout && (
        <CheckoutPro
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setUpgraded(true)}
        />
      )}
    </div>
  )
}
