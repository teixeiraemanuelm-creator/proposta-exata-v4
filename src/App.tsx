import { useState } from 'react'
import { AuthProvider, ThemeProvider, useAuth } from '@/contexts'
import { Sidebar } from '@/components/layout/Sidebar'
import { LoginPage, OnboardingPage } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { OrcamentosLista, OrcamentoForm, OrcamentoDetalhe, OrcamentoPublico } from '@/pages/Orcamentos'
import { Clientes, Produtos, Recibos, ReciboForm, Estoque, Equipe, Relatorios, Pagamentos, Configuracoes } from '@/pages/Modules'
import { Spinner } from '@/components/ui'
import type { Screen } from '@/types'

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
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 lg:px-8 py-6 lg:py-8 pl-16 lg:pl-8">
          {renderScreen()}
        </div>
      </main>
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
