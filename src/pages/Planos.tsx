import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Zap, Crown, ArrowRight, X, QrCode, CreditCard, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts'
import { supabase, ativarPlano } from '@/lib/supabase'
import { R$ } from '@/lib/utils'
import { Btn, Spinner } from '@/components/ui'

const MP_PUBLIC_KEY = 'APP_USR-86adaed4-9e88-4a67-84df-1cd97a08482d'
const VALOR_MENSAL = 39.90
const VALOR_ANUAL = 29.90
const VALOR_PRO = 39.90

// ─── Gate — bloqueia criação de orçamento no plano free ───────────────────────
export function OrcamentoGate({ onContinue, onUpgrade }: { onContinue: () => void; onUpgrade: () => void }) {
  const { plano } = useAuth()

  if (plano === 'pro') { onContinue(); return null }

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
          <p className="text-2xl font-black text-white">R$ 39,90<span className="text-sm font-normal text-gray-400">/mês</span></p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-left">
            {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
              <li key={f} className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onUpgrade} icon={<Zap size={15} />}>Assinar Pro — R$ 39,90/mês</Btn>
          <button onClick={onContinue} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">Voltar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Checkout Pro ─────────────────────────────────────────────────────────────
type Metodo = 'escolha' | 'pix' | 'cartao'

export function CheckoutPro({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { empresa, refreshAssinatura } = useAuth()
  const [metodo, setMetodo] = useState<Metodo>('escolha')
  const [tipoPlano, setTipoPlano] = useState<'mensal' | 'anual'>('mensal')
  const [step, setStep] = useState<'form' | 'processando' | 'sucesso' | 'erro'>('form')
  const [pixData, setPixData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const bricksRef = useRef<any>(null)
  const valorAtual = tipoPlano === 'anual' ? 29.90 * 12 : 39.90
  const bricksMounted = useRef(false)

  // Carrega SDK do MP quando metodo = cartao
  useEffect(() => {
    if (metodo !== 'cartao') return
    if (bricksMounted.current) return

    const loadMP = async () => {
      if (!(window as any).MercadoPago) {
        const script = document.createElement('script')
        script.src = 'https://sdk.mercadopago.com/js/v2'
        script.async = true
        document.head.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })
      }

      const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })
      const bricks = mp.bricks()

      const settings = {
        initialization: {
          amount: VALOR_PRO,
          preferenceId: null,
        },
        customization: {
          visual: {
            style: {
              theme: 'dark',
              customVariables: {
                baseColor: '#f97316',
                baseColorFirstVariant: '#ea6a0a',
                baseColorSecondVariant: '#dc5b00',
                fontSizeSmall: '12px',
                fontSizeMedium: '14px',
                fontSizeLarge: '16px',
                fontSizeXLarge: '20px',
                borderRadiusSmall: '6px',
                borderRadiusMedium: '8px',
                borderRadiusLarge: '12px',
                formBackgroundColor: '#1a1829',
                inputBackgroundColor: '#0f0e17',
              },
            },
            hidePaymentButton: false,
            hideFormTitle: true,
          },
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'excluded',
            bankTransfer: 'excluded',
            mercadoPago: 'excluded',
            maxInstallments: 3,
          },
        },
        locale: 'pt-BR',
        callbacks: {
          onReady: () => { bricksMounted.current = true },
          onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
            setStep('processando')
            try {
              const { data: { session } } = await supabase.auth.getSession()
              const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/processar-pagamento`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token ?? ''}`,
                  },
                  body: JSON.stringify({
                    formData,
                    empresa_id: empresa?.id,
                    valor: VALOR_PRO,
                    email: session?.user?.email,
                    nome: empresa?.nome,
                  }),
                }
              )
              const data = await res.json()
              if (data.ok && (data.status === 'approved' || data.status === 'in_process')) {
                await ativarPlano(empresa!.id, data.payment_id)
                await refreshAssinatura()
                setStep('sucesso')
                setTimeout(() => { onSuccess(); onClose() }, 2500)
              } else {
                setErro(data.erro ?? 'Pagamento não aprovado. Tente outro cartão.')
                setStep('erro')
              }
            } catch {
              setErro('Erro de conexão. Tente novamente.')
              setStep('erro')
            }
          },
          onError: (error: any) => {
            console.error('MP Brick error:', error)
          },
        },
      }

      bricksRef.current = await bricks.create('payment', 'mp-payment-brick', settings)
    }

    loadMP()

    return () => {
      if (bricksRef.current) {
        bricksRef.current.unmount?.()
        bricksMounted.current = false
      }
    }
  }, [metodo])

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
            valor: valorAtual,
            descricao: `Proposta Exata Pro — Assinatura ${tipoPlano === 'anual' ? 'Anual R$ 358,80' : 'Mensal R$ 39,90'}`,
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
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  async function confirmarPix() {
    if (!empresa || !pixData) return
    setConfirmando(true)
    await ativarPlano(empresa.id, pixData.order_id)
    await refreshAssinatura()

    // Google Ads — conversão de compra
    if (typeof (window as any).gtag === 'function') {
      ;(window as any).gtag('event', 'conversion', {
        send_to: 'AW-18242129357/gT23COzE3L8cEM2bw_pD',
        value: valorAtual,
        currency: 'BRL',
        transaction_id: pixData.order_id,
      })
    }

    setStep('sucesso')
    setConfirmando(false)
    setTimeout(() => { onSuccess(); onClose() }, 2500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-md p-6 flex flex-col gap-5 my-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white flex items-center gap-2">
            <Crown size={18} className="text-orange-400" /> Assinar Pro
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
        </div>

        {/* Preço */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
          {/* Seletor mensal/anual */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTipoPlano?.('mensal')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${tipoPlano === 'mensal' ? 'bg-orange-500 text-white border-orange-500' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
            >
              Mensal<br /><span className="text-xs font-normal">R$ 39,90/mês</span>
            </button>
            <button
              onClick={() => setTipoPlano?.('anual')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all relative ${tipoPlano === 'anual' ? 'bg-orange-500 text-white border-orange-500' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">-25%</span>
              Anual<br /><span className="text-xs font-normal">R$ 29,90/mês</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-1">Plano Pro · {tipoPlano === 'anual' ? 'Anual' : 'Mensal'}</p>
          <p className="text-4xl font-black text-white">{tipoPlano === 'anual' ? 'R$ 29,90' : 'R$ 39,90'}</p>
          <p className="text-xs text-gray-500 mt-1">ou anual por R$ 29,90/mês</p>
        </div>

        {/* Sucesso */}
        {step === 'sucesso' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Bem-vindo ao Pro!</h3>
              <p className="text-sm text-gray-400">Plano ativado com sucesso.</p>
            </div>
          </div>
        )}

        {/* Processando */}
        {step === 'processando' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner size={36} />
            <p className="text-sm text-gray-400">Processando pagamento...</p>
          </div>
        )}

        {/* Erro */}
        {step === 'erro' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 text-center">{erro}</div>
            <Btn variant="secondary" full onClick={() => { setStep('form'); setMetodo('escolha') }}>Tentar novamente</Btn>
          </>
        )}

        {/* Escolha do método */}
        {step === 'form' && metodo === 'escolha' && (
          <>
            <p className="text-sm text-gray-400 text-center">Escolha como pagar:</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setMetodo('pix'); gerarPix() }}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <QrCode size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Pix</p>
                  <p className="text-xs text-gray-500">Aprovação instantânea · R$ 39,90</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 ml-auto" />
              </button>

              <button
                onClick={() => setMetodo('cartao')}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Cartão de crédito ou débito</p>
                  <p className="text-xs text-gray-500">Até 3x sem juros · R$ 13,30/parcela</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 ml-auto" />
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center">Sem contrato. Cancele quando quiser.</p>
          </>
        )}

        {/* Pix */}
        {step === 'form' && metodo === 'pix' && (
          <>
            {loading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Spinner size={32} />
                <p className="text-sm text-gray-400">Gerando QR Code...</p>
              </div>
            )}
            {erro && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 text-center">{erro}</div>}
            {pixData && !loading && (
              <>
                {pixData.qr_code_base64 && (
                  <div className="flex justify-center">
                    <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-48 h-48 rounded-xl border border-white/10" />
                  </div>
                )}
                {pixData.pix_copia_e_cola && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-gray-500">Pix Copia e Cola</p>
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-mono flex-1 truncate">{pixData.pix_copia_e_cola.slice(0, 40)}...</p>
                      <button onClick={() => navigator.clipboard.writeText(pixData.pix_copia_e_cola)} className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex-shrink-0">Copiar</button>
                    </div>
                  </div>
                )}
                <Btn full loading={confirmando} onClick={confirmarPix}>✓ Já paguei — Ativar Pro</Btn>
                <p className="text-xs text-gray-600 text-center">Clique após confirmar o pagamento no banco</p>
              </>
            )}
            <button onClick={() => setMetodo('escolha')} className="text-xs text-gray-600 hover:text-gray-400 text-center">← Outro método</button>
          </>
        )}

        {/* Cartão — MP Bricks */}
        {step === 'form' && metodo === 'cartao' && (
          <>
            <div id="mp-payment-brick" className="min-h-[300px]" />
            <button onClick={() => { setMetodo('escolha'); bricksMounted.current = false }} className="text-xs text-gray-600 hover:text-gray-400 text-center">← Outro método</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal Cancelar Assinatura ────────────────────────────────────────────────
function CancelarAssinatura({ onClose, onCancelado }: { onClose: () => void; onCancelado: () => void }) {
  const { empresa, refreshAssinatura } = useAuth()
  const [step, setStep] = useState<'confirm' | 'loading' | 'done'>('confirm')
  const [erro, setErro] = useState('')

  async function cancelar() {
    if (!empresa) return
    setStep('loading')
    setErro('')
    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'cancelado',
          cancelado_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('empresa_id', empresa.id)

      if (error) throw error
      await refreshAssinatura()

      // Email de confirmação de cancelamento
      const { data: { session } } = await supabase.auth.getSession()
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-cancelamento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: session?.user?.email,
            nome: session?.user?.user_metadata?.full_name ?? session?.user?.email,
            empresa: empresa.nome,
          }),
        }
      ).catch(() => {/* silencioso */})

      setStep('done')
      setTimeout(() => { onCancelado(); onClose() }, 2500)
    } catch {
      setErro('Erro ao cancelar. Tente novamente ou entre em contato.')
      setStep('confirm')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#13121f] border border-white/10 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            Cancelar assinatura
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
        </div>

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-500/15 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="font-black text-white mb-1">Assinatura cancelada</p>
              <p className="text-xs text-gray-400">Você voltou ao plano Free. Obrigado por ter usado o Pro!</p>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner size={32} />
            <p className="text-sm text-gray-400">Cancelando...</p>
          </div>
        )}

        {step === 'confirm' && (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-300 font-semibold mb-2">O que você vai perder:</p>
              <ul className="flex flex-col gap-1.5">
                {['Orçamentos ilimitados', 'Múltiplos usuários', 'PDF com logo', 'Relatórios avançados'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-red-400/80">
                    <X size={12} className="flex-shrink-0" /> {f}
                </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Seu plano será rebaixado para Free imediatamente. Seus dados permanecem salvos.
            </p>
            {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
            <div className="flex flex-col gap-2">
              <button
                onClick={cancelar}
                className="w-full py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm transition-colors"
              >
                Sim, cancelar minha assinatura
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/5 transition-colors"
              >
                Manter Pro
              </button>
            </div>
            <p className="text-xs text-gray-700 text-center">
              Dúvidas? <a href="https://wa.me/5516991169184" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-500">Fale conosco pelo WhatsApp</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tela Planos ──────────────────────────────────────────────────────────────
export function Planos() {
  const { plano, assinatura, refreshAssinatura } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCancelar, setShowCancelar] = useState(false)
  const isPro = plano === 'pro'

  return (
    <div className="w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Plano & Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Status */}
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
                  : '5 orçamentos/mês · 1 usuário'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPro ? 'bg-orange-500/20 text-orange-400' : 'bg-white/8 text-gray-400'}`}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
      </div>

      {!isPro && (
        <div className="flex flex-col gap-3 mb-6">
          {/* Free */}
          <div className="card p-5 border border-white/8 opacity-60">
            <p className="text-sm font-semibold text-gray-400 mb-1">Free</p>
            <p className="text-3xl font-black text-white mb-3">R$ 0<span className="text-sm font-normal text-gray-500"> /mês</span></p>
            <ul className="flex flex-col gap-1.5 mb-4">
              {['5 orçamentos/mês', '1 usuário', 'PDF básico', 'Link de aprovação'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={13} className="text-gray-600 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-gray-600 text-center font-semibold">Plano atual</div>
          </div>

          {/* Pro Mensal */}
          <div className="card p-5 border border-orange-500/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-300">Pro Mensal</p>
            </div>
            <p className="text-3xl font-black text-white mb-1">R$ 39,90<span className="text-sm font-normal text-gray-500"> /mês</span></p>
            <p className="text-xs text-gray-500 mb-3">sem fidelidade</p>
            <ul className="flex flex-col gap-1.5 mb-4">
              {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Pix + Cartão', 'Suporte prioritário'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-orange-300/80">
                  <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Btn full onClick={() => setShowCheckout(true)} icon={<Crown size={14} />}>Assinar Mensal — R$ 39,90</Btn>
          </div>

          {/* Pro Anual */}
          <div className="card p-5 border border-emerald-500/40 relative" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.08)' }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">ECONOMIZE 25%</span>
            <div className="flex items-center justify-between mb-1 mt-2">
              <p className="text-sm font-semibold text-gray-300">Pro Anual</p>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Popular</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">R$ 29,90<span className="text-sm font-normal text-gray-500"> /mês</span></p>
            <p className="text-xs text-gray-500 mb-3">cobrado R$ 358,80/ano</p>
            <ul className="flex flex-col gap-1.5 mb-4">
              {['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'Pix + Cartão', 'Suporte prioritário'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-emerald-300/80">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Btn full onClick={() => setShowCheckout(true)} icon={<Crown size={14} />}>Assinar Anual — R$ 358,80</Btn>
          </div>

          {/* Premium Vitalício */}
          <a href="/fundadores" className="card p-5 border border-amber-500/30 block hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-amber-300">Premium Vitalício</p>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">100 vagas</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">R$ 499<span className="text-sm font-normal text-gray-500"> único</span></p>
            <p className="text-xs text-gray-500 mb-2">sem mensalidade · todas as atualizações inclusas</p>
            <p className="text-xs text-amber-400 font-semibold">→ Ver oferta de fundador</p>
          </a>
        </div>
      )}


      {isPro && (
        <div className="card p-5 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm">Tudo liberado no Pro</p>
              <p className="text-xs text-gray-500">Orçamentos ilimitados, 5 usuários, PDF com logo e relatórios.</p>
            </div>
          </div>
        </div>
      )}

      {isPro && (
        <div className="mt-6 pt-6 border-t border-white/6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Gerenciar assinatura</h3>
          <button
            onClick={() => setShowCancelar(true)}
            className="text-sm text-red-500/70 hover:text-red-400 transition-colors underline underline-offset-4"
          >
            Cancelar minha assinatura
          </button>
          <p className="text-xs text-gray-700 mt-1">Seu plano voltará para Free imediatamente.</p>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-6">Dúvidas? WhatsApp: (16) 99116-9184</p>

      {showCheckout && (
        <CheckoutPro onClose={() => setShowCheckout(false)} onSuccess={() => {}} />
      )}

      {showCancelar && (
        <CancelarAssinatura
          onClose={() => setShowCancelar(false)}
          onCancelado={() => refreshAssinatura()}
        />
      )}
    </div>
  )
}
