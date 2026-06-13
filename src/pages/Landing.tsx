import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { CheckCircle2, ArrowRight, Zap, Users, FileText, BarChart3, Shield, MessageCircle, ChevronDown } from 'lucide-react'

// ─── Hero mock screens ─────────────────────────────────────────────────────────
function MockDashboard() {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-white/80">Dashboard</span>
        <span className="text-[9px] text-white/30">Jun 2026</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[['R$ 48.200', 'Receita aprovada'], ['94%', 'Taxa de conversão'], ['31', 'Orçamentos'], ['R$ 1.580', 'Ticket médio']].map(([v, l]) => (
          <div key={l} className="bg-white/5 rounded-lg p-2.5">
            <p className="text-sm font-bold text-orange-400">{v}</p>
            <p className="text-[9px] text-white/40 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/5 rounded-lg p-3 flex-1">
        <p className="text-[9px] text-white/40 mb-2">Receita — últimos 6 meses</p>
        <div className="flex items-end gap-1.5 h-12">
          {[40, 55, 35, 70, 60, 85].map((h, i) => (
            <div key={i} className="flex-1 bg-orange-500/60 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MockOrcamento() {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-white/80">Orçamento #0042</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Enviado</span>
      </div>
      <div className="bg-white/5 rounded-lg p-2.5">
        <p className="text-[9px] text-white/40">Cliente</p>
        <p className="text-[10px] font-semibold text-white mt-0.5">Construtora Horizonte Ltda</p>
        <p className="text-[9px] text-white/30 mt-1">Validade: 15 dias · PIX ou Transferência</p>
      </div>
      <div className="bg-white/5 rounded-lg p-2.5 flex-1">
        <div className="flex justify-between text-[9px] text-white/30 pb-1.5 border-b border-white/8 mb-1.5">
          <span>DESCRIÇÃO</span><span>TOTAL</span>
        </div>
        {[['Piso Drenante 40×40 – 120m²', 'R$ 9.600'], ['Transporte e instalação', 'R$ 1.800'], ['Regularização base', 'R$ 2.400']].map(([d, v]) => (
          <div key={d} className="flex justify-between text-[9px] py-1 border-b border-white/5">
            <span className="text-white/60 truncate max-w-[70%]">{d}</span>
            <span className="text-white/80 font-medium">{v}</span>
          </div>
        ))}
        <div className="flex justify-between text-[10px] font-bold mt-2">
          <span className="text-white/60">Total</span>
          <span className="text-orange-400">R$ 13.800</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-green-500/20 rounded-lg py-1.5 text-center text-[9px] text-green-400 font-semibold">✓ Aprovar</div>
        <div className="flex-1 bg-white/5 rounded-lg py-1.5 text-center text-[9px] text-white/40">WhatsApp</div>
      </div>
    </div>
  )
}

function MockLista() {
  const items = [
    { n: '#0042', c: 'Construtora Horizonte', v: 'R$ 13.800', s: 'enviado', sc: 'text-blue-400 bg-blue-500/15' },
    { n: '#0041', c: 'Reformas Rápidas ME', v: 'R$ 4.200', s: 'aprovado', sc: 'text-green-400 bg-green-500/15' },
    { n: '#0040', c: 'Auto Peças Central', v: 'R$ 8.950', s: 'aprovado', sc: 'text-green-400 bg-green-500/15' },
    { n: '#0039', c: 'Studio Arquitetura', v: 'R$ 22.100', s: 'em análise', sc: 'text-yellow-400 bg-yellow-500/15' },
  ]
  return (
    <div className="w-full h-full p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-white/80">Orçamentos</span>
        <div className="bg-orange-500 rounded px-2 py-0.5 text-[9px] text-white font-bold">+ Novo</div>
      </div>
      <div className="bg-white/5 rounded-lg overflow-hidden flex-1">
        <div className="grid grid-cols-[36px_1fr_56px_52px] gap-1 px-2.5 py-1.5 border-b border-white/8">
          {['Nº', 'CLIENTE', 'VALOR', 'STATUS'].map(h => (
            <span key={h} className="text-[8px] text-white/25 font-bold">{h}</span>
          ))}
        </div>
        {items.map(it => (
          <div key={it.n} className="grid grid-cols-[36px_1fr_56px_52px] gap-1 px-2.5 py-1.5 border-b border-white/5 items-center">
            <span className="text-[9px] text-white/30 font-mono">{it.n}</span>
            <span className="text-[9px] text-white/70 truncate">{it.c}</span>
            <span className="text-[9px] text-white font-semibold">{it.v}</span>
            <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full text-center ${it.sc}`}>{it.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS = [
  { label: 'Dashboard', component: MockDashboard },
  { label: 'Orçamentos', component: MockOrcamento },
  { label: 'Lista', component: MockLista },
]

function AppMockup() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % SCREENS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const Screen = SCREENS[active].component

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full scale-110 pointer-events-none" />

      {/* Device frame */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0f0e17] overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16', maxHeight: 480 }}>
        {/* Topbar mock */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/6 bg-[#0f0e17]">
          <div className="w-4 h-4 rounded-md bg-orange-500/80 flex items-center justify-center">
            <span className="text-[7px] font-black text-white">PE</span>
          </div>
          <div className="flex gap-1.5">
            {SCREENS.map((s, i) => (
              <button key={s.label} onClick={() => setActive(i)}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${i === active ? 'bg-orange-500/20 text-orange-400 font-semibold' : 'text-white/30'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen content */}
        <div className="relative overflow-hidden" style={{ height: 'calc(100% - 36px)' }}>
          <div key={active} className="absolute inset-0 animate-fade-in">
            <Screen />
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -left-6 top-16 bg-green-500/15 border border-green-500/30 rounded-xl px-3 py-2 backdrop-blur-sm animate-float">
        <p className="text-[10px] font-bold text-green-400">✓ Aprovado pelo cliente</p>
        <p className="text-[9px] text-white/40">há 2 minutos</p>
      </div>
      <div className="absolute -right-6 bottom-24 bg-orange-500/15 border border-orange-500/30 rounded-xl px-3 py-2 backdrop-blur-sm animate-float-delay">
        <p className="text-[10px] font-bold text-orange-400">PDF gerado</p>
        <p className="text-[9px] text-white/40">R$ 13.800 · #0042</p>
      </div>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: FileText, title: 'Orçamentos profissionais', desc: 'Monte propostas com itens, desconto, frete e condições de pagamento em minutos.' },
  { icon: MessageCircle, title: 'Aprovação pelo WhatsApp', desc: 'Cliente clica em um link e aprova ou recusa. Status atualiza em tempo real no seu painel.' },
  { icon: BarChart3, title: 'Relatórios de desempenho', desc: 'Acompanhe receita aprovada, taxa de conversão e ticket médio por período.' },
  { icon: Users, title: 'Equipe de vendas', desc: 'Convide vendedores e defina permissões. Cada um acessa só o que precisa.' },
  { icon: Zap, title: 'Catálogo de produtos', desc: 'Cadastre produtos com preço e unidade. Selecione no orçamento com um clique.' },
  { icon: Shield, title: 'Dados seguros', desc: 'Infraestrutura Supabase com RLS — seus dados isolados por empresa, sem compartilhamento.' },
]

const TESTIMONIALS = [
  { nome: 'Ricardo A.', cargo: 'Proprietário · Construtora RA', texto: 'Antes levava 40 minutos por orçamento no Excel. Hoje faço em 5 e o cliente aprova pelo celular.', inicial: 'R' },
  { nome: 'Fernanda C.', cargo: 'Gerente Comercial · Auto Peças', texto: 'A taxa de conversão subiu porque o cliente consegue ver e aprovar na hora. Simples assim.', inicial: 'F' },
  { nome: 'Paulo M.', cargo: 'Dono · Reformas & Serviços', texto: 'Nunca mais perdi orçamento por esquecimento. O painel mostra tudo e o PDF sai na hora.', inicial: 'P' },
]

const PLANS = [
  {
    name: 'Free',
    price: 'R$ 0',
    period: 'para sempre',
    color: 'border-white/10',
    badge: null,
    features: ['5 orçamentos/mês', '1 usuário', 'PDF básico', 'Link de aprovação', 'Suporte por email'],
    cta: 'Começar grátis',
    ctaStyle: 'bg-white/8 hover:bg-white/12 text-white border border-white/15',
  },
  {
    name: 'Pro',
    price: 'R$ 47',
    period: '/mês',
    color: 'border-orange-500/50',
    badge: 'Mais popular',
    features: ['Orçamentos ilimitados', 'Até 5 usuários', 'PDF com logo', 'Relatórios avançados', 'WhatsApp integrado', 'Suporte prioritário'],
    cta: 'Assinar Pro',
    ctaStyle: 'bg-orange-500 hover:bg-orange-400 text-white',
  },
]

const FAQS = [
  { q: 'Preciso instalar alguma coisa?', r: 'Não. O Proposta Exata é 100% online. Acesse pelo navegador no computador ou celular, sem instalação.' },
  { q: 'Posso testar antes de pagar?', r: 'Sim. O plano Free é gratuito para sempre com 5 orçamentos/mês. Você só assina o Pro quando quiser mais.' },
  { q: 'O cliente precisa ter conta para aprovar?', r: 'Não. Você envia um link único e o cliente aprova ou recusa com um clique, sem cadastro.' },
  { q: 'Meus dados ficam seguros?', r: 'Sim. Cada empresa tem seus dados completamente isolados. Nenhuma outra empresa consegue ver as suas informações.' },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
      {FAQS.map((f, i) => (
        <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors">
            <span className="text-sm font-semibold text-white">{f.q}</span>
            <ChevronDown size={16} className={`text-gray-500 transition-transform flex-shrink-0 ml-3 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-sm text-gray-400 leading-relaxed">{f.r}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Landing page ──────────────────────────────────────────────────────────────
export function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <div className="min-h-screen bg-[#0f0e17] text-white overflow-x-hidden">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes float-delay { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-fade-in { animation: fade-in 0.4s ease both; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delay { animation: float-delay 3.5s ease-in-out infinite 0.5s; }
        .gradient-text { background: linear-gradient(135deg, #fff 30%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-orange { box-shadow: 0 0 40px rgba(249,115,22,0.15); }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/6 bg-[#0f0e17]/80 backdrop-blur-md">
        <Logo size="sm" />
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#precos" className="hover:text-white transition-colors">Preços</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onEnterApp} className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</button>
          <button onClick={onEnterApp}
            className="bg-orange-500 hover:bg-orange-400 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-xl">
            Começar grátis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-orange-400 font-medium">Plano Free disponível — sem cartão</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-5">
              <span className="gradient-text">Orçamentos que vendem</span>
              <br />em qualquer área
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
              Monte propostas profissionais, envie pelo WhatsApp e deixe o cliente aprovar com um clique. Do rascunho ao PDF em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button onClick={onEnterApp}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-6 py-3.5 rounded-xl text-base glow-orange">
                Criar conta grátis <ArrowRight size={18} />
              </button>
              <button onClick={onEnterApp}
                className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/25 hover:bg-white/5 transition-all text-white font-semibold px-6 py-3.5 rounded-xl text-base">
                Ver demonstração
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              {['Sem instalação', 'Aprovação por link', 'Relatórios em tempo real'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-orange-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="flex justify-center lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* LOGOS (social proof) */}
      <section className="py-10 border-y border-white/6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">Usado por empresas de diferentes segmentos</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-semibold text-white/20">
            {['Construção civil', 'Reformas', 'Auto peças', 'Arquitetura', 'Serviços gerais', 'Materiais'].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl lg:text-4xl font-black">Tudo que você precisa para fechar mais negócios</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-orange-500/20 hover:bg-white/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-orange-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-6 bg-white/2 border-y border-white/6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-3">Como funciona</p>
          <h2 className="text-3xl font-black mb-14">Do orçamento à aprovação em 3 passos</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Monte o orçamento', desc: 'Selecione produtos do catálogo, adicione itens livres, defina desconto e condições.' },
              { step: '2', title: 'Envie para o cliente', desc: 'Compartilhe um link pelo WhatsApp ou email. O cliente abre no celular sem precisar de login.' },
              { step: '3', title: 'Acompanhe em tempo real', desc: 'Quando o cliente aprovar, seu status atualiza na hora. Gere o PDF em um clique.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-xl font-black text-white">
                  {s.step}
                </div>
                <h3 className="font-bold text-white text-lg">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl font-black">Quem usa não volta para o Excel</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.nome} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-5">"{t.texto}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                    {t.inicial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.nome}</p>
                    <p className="text-xs text-gray-600">{t.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" className="py-24 px-6 bg-white/2 border-y border-white/6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-3">Preços</p>
            <h2 className="text-3xl font-black">Comece grátis. Cresça quando precisar.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PLANS.map(p => (
              <div key={p.name} className={`relative bg-white/3 border rounded-2xl p-7 flex flex-col ${p.color} ${p.badge ? 'glow-orange' : ''}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {p.badge}
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-400 mb-1">{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{p.price}</span>
                    <span className="text-gray-500 text-sm">{p.period}</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 size={14} className="text-orange-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onEnterApp} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${p.ctaStyle}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">Sem contrato mínimo. Cancele quando quiser.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-black">Perguntas frequentes</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">
            Pronto para fechar mais negócios?
          </h2>
          <p className="text-gray-400 mb-8">Crie sua conta grátis em menos de 1 minuto. Sem cartão de crédito.</p>
          <button onClick={onEnterApp}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-8 py-4 rounded-xl text-lg glow-orange">
            Criar conta grátis <ArrowRight size={20} />
          </button>
          <p className="text-xs text-gray-600 mt-4">Plano Free · Sem cartão · Pronto em 60 segundos</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/6 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-gray-600">© 2026 Proposta Exata · CDD Tech Solutions · Ribeirão Preto, SP</p>
          <div className="flex gap-5 text-xs text-gray-600">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="https://wa.me/5516991169184" target="_blank" rel="noopener" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
