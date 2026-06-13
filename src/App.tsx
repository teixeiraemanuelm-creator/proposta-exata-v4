import { useState } from 'react'
import { AuthProvider, ThemeProvider, useAuth, useTheme } from '@/contexts'
import { Sidebar } from '@/components/layout/Sidebar'
import { LoginPage, OnboardingPage } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { OrcamentosLista, OrcamentoForm, OrcamentoDetalhe, OrcamentoPublico } from '@/pages/Orcamentos'
import { Clientes, Produtos, Recibos, ReciboForm, Estoque, Equipe, Relatorios, Pagamentos, Configuracoes } from '@/pages/Modules'
import { Spinner } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { Sun, Moon } from 'lucide-react'
import type { Screen } from '@/types'

const SCREEN_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  orcamentos: 'Orçamentos',
  'orcamento-novo': 'Orçamentos',
  'orcamento-detalhe': 'Orçamentos',
  clientes: 'Clientes',
  'cliente-novo': 'Clientes',
  produtos: 'Produtos',
  recibos: 'Recibos',
  'recibo-novo': 'Recibos',
  estoque: 'Estoque',
  equipe: 'Equipe',
  relatorios: 'Relatórios',
  pagamentos: 'Pagamentos',
  configuracoes: 'Configurações',
}

function Topbar({ screen }: { screen: Screen }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/6 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <span className="text-sm text-gray-400">{SCREEN_LABELS[screen] ?? ''}</span>
      </div>
      <button onClick={toggleTheme} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        {theme === 'dark' ? 'Claro' : 'Escuro'}
      </button>
    </div>
  )
}

function AppShell() {
  const { user, empresa, loading, empresaLoading } = useAuth()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedId, setSelectedId] = useState<string>()

  function navigate(s: Screen, id?: string) { setScreen(s); setSelectedId(id) }

  // Check if it's a public URL
  if (window.location.pathname.startsWith('/orcamento-publico/')) {
    const id = window.location.pathname.split('/').pop() ?? ''
    return <OrcamentoPublico id={id} />
  }

  if (loading || (user && empresaLoading)) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Spinner size={36} /></div>
  }

  if (!user) return <LoginPage />
  if (!empresa) return <OnboardingPage />

  function renderScreen() {
    switch (screen) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />
      case 'orcamentos': return <OrcamentosLista onNavigate={navigate} />
      case 'orcamento-novo': return <OrcamentoForm editId={selectedId} onNavigate={navigate} />
      case 'orcamento-detalhe': return selectedId ? <OrcamentoDetalhe id={selectedId} onNavigate={navigate} /> : <OrcamentosLista onNavigate={navigate} />
      case 'clientes': return <Clientes />
      case 'cliente-novo': return <Clientes />
      case 'produtos': return <Produtos />
      case 'recibos': return <Recibos onNovoRecibo={() => navigate('recibo-novo')} />
      case 'recibo-novo': return <ReciboForm onBack={() => navigate('recibos')} empresaId={empresa.id} />
      case 'estoque': return <Estoque />
      case 'equipe': return <Equipe />
      case 'relatorios': return <Relatorios />
      case 'pagamentos': return <Pagamentos />
      case 'configuracoes': return <Configuracoes />
      default: return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen flex bg-dark-900">
      <Sidebar current={screen} onNavigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar screen={screen} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-10 py-6 lg:py-8">
            {renderScreen()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  )
}
