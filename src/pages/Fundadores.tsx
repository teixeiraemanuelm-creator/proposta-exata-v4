import { useState } from 'react'
import { Crown, CheckCircle2, Star, Zap, X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts'
import { supabase } from '@/lib/supabase'
import { Btn, Spinner } from '@/components/ui'
import { Logo } from '@/components/Logo'

const VALOR_LIFETIME = 1500

// ─── Checkout Lifetime ────────────────────────────────────────────────────────
function CheckoutLifetime({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { empresa, user, refreshAssinatura } = useAuth()
  const [step, setStep] = useState<'pix' | 'confirmando' | 'sucesso'>('pix')
  const [pixData, setPixData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')

  async function gerarPix() {
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
            valor: VALOR_LIFETIME,
            descricao: 'Proposta Exata — Licença Vitalícia Fundador',
            email: user?.email ?? 'fundador@propostaexata.com.br',
            nome: empresa?.nome ?? 'Fundador',
            cpf: empresa?.cnpj?.replace(/\D/g, '') ?? '00000000000',
            orcamento_id: `lifetime-${empresa?.id ?? 'x'}-${Date.now()}`,
            numero: 'LIFETIME',
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

  async function confirmarPagamento() {
    if (!empresa) return
    setConfirmando(true)
    try {
      // Ativa licença vitalícia
      await supabase.from('assinaturas').upsert({
        empresa_id: empresa.id,
        plano: 'lifetime',
        status: 'ativo',
        mp_payment_id: pixData?.payment_id ?? `lifetime-manual-${Date.now()}`,
        valor_mensal: 0,
        inicio: new Date().toISOString(),
        proximo_vencimento: '2099-12-31T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'empresa_id' })

      // Marca como fundador
      await supabase.from('empresas').update({ fundador: true }).eq('id', empresa.id)

      await refreshAssinatura()
      setStep('sucesso')
      setTimeout(() => { onSuccess(); onClose() }, 3000)
    } catch {
      setErro('Erro ao ativar licença. Entre em contato: (16) 99116-9184')
    }
    setConfirmando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-sm p-6 flex flex-col gap-5 my-4 border border-orange-500/30" style={{ boxShadow: '0 0 40px rgba(249,115,22,0.15)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white flex items-center gap-2">
            <Star size={18} className="text-orange-400" /> Licença Fundador
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"><X size={16} /></button>
        </div>

        {step === 'sucesso' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center">
              <Star size={32} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-1">Bem-vindo, Fundador!</h3>
              <p className="text-sm text-gray-400">Sua licença vitalícia foi ativada.</p>
              <p className="text-xs text-gray-500 mt-1">Você terá acesso antecipado a todas as novidades.</p>
            </div>
          </div>
        )}

        {step === 'pix' && (
          <>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Licença Vitalícia — Pagamento único</p>
              <p className="text-4xl font-black text-white">R$ 1.500</p>
              <p className="text-xs text-gray-500 mt-1">sem mensalidade para sempre</p>
            </div>

            {!pixData && !loading && (
              <>
                {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
                <Btn full icon={<ArrowRight size={15} />} onClick={gerarPix}>Gerar QR Code Pix</Btn>
              </>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Spinner size={28} />
                <p className="text-sm text-gray-400">Gerando QR Code...</p>
              </div>
            )}

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
                {erro && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2 text-center">{erro}</p>}
                <Btn full loading={confirmando} onClick={confirmarPagamento}>✓ Já paguei — Ativar Licença</Btn>
                <p className="text-xs text-gray-600 text-center">Clique após confirmar o pagamento no banco</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página Fundadores ────────────────────────────────────────────────────────
export function PaginaFundadores() {
  const { user, empresa, plano } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const isLifetime = plano === 'lifetime' || sucesso

  const beneficios = [
    'Acesso vitalício ao Proposta Exata Pro',
    'Todas as atualizações futuras incluídas',
    'Acesso antecipado com 15 dias de antecedência',
    'Badge exclusivo "Fundador" no app',
    'Suporte prioritário direto via WhatsApp',
    'Voto em novas funcionalidades',
    '1 usuário por licença',
  ]

  return (
    <div className="min-h-screen bg-[#0f0e17] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <Logo />
        {user && empresa && (
          <p className="text-xs text-gray-500">{empresa.nome}</p>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-8">
          <Star size={14} className="text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">Oferta exclusiva — Grupo Fundadores</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 max-w-2xl leading-tight">
          Seja um <span className="text-orange-400">Fundador</span> do Proposta Exata
        </h1>
        <p className="text-lg text-gray-400 mb-3 max-w-lg">
          Pagamento único de <strong className="text-white">R$ 1.500</strong>. Acesso vitalício. Para sempre.
        </p>
        <p className="text-sm text-gray-500 mb-10">Apenas 20 vagas disponíveis.</p>

        {/* Benefícios */}
        <div className="grid sm:grid-cols-2 gap-3 mb-10 max-w-xl w-full text-left">
          {beneficios.map(b => (
            <div key={b} className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isLifetime ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-2xl px-6 py-4">
              <Star size={20} className="text-orange-400" />
              <span className="font-black text-white">Você já é um Fundador! 🎉</span>
            </div>
            <p className="text-xs text-gray-500">Obrigado por fazer parte desta história.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setShowCheckout(true)}
              className="flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-lg px-10 py-4 rounded-2xl transition-all"
              style={{ boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
            >
              <Star size={20} /> Garantir minha vaga — R$ 1.500
            </button>
            <p className="text-xs text-gray-600">Pagamento único via Pix · Sem mensalidade · Para sempre</p>
          </div>
        )}

        {/* Social proof */}
        <div className="mt-16 pt-8 border-t border-white/6 w-full max-w-xl">
          <p className="text-xs text-gray-600 text-center mb-4">Dúvidas? Fale diretamente com o fundador</p>
          <div className="flex items-center justify-center gap-3">
            <a href="https://wa.me/5516991169184" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600/20 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-600/30 transition-colors">
              WhatsApp (16) 99116-9184
            </a>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutLifetime
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setSucesso(true)}
        />
      )}
    </div>
  )
}

// ─── Badge Fundador (para usar na sidebar/header) ─────────────────────────────
export function BadgeFundador() {
  return (
    <span className="inline-flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
      <Star size={10} /> Fundador
    </span>
  )
}
