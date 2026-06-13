import { useState } from 'react'
import {
  LayoutDashboard, FileText, Users, Package, Receipt,
  Warehouse, UserCheck, BarChart3, CreditCard, Settings,
  Menu, X, LogOut, Sun, Moon, Crown
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useAuth, useTheme } from '@/contexts'
import { signOut } from '@/lib/supabase'
import type { Screen } from '@/types'

const NAV: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { screen: 'orcamentos', label: 'Orçamentos', icon: <FileText size={16} /> },
  { screen: 'clientes', label: 'Clientes', icon: <Users size={16} /> },
  { screen: 'produtos', label: 'Produtos', icon: <Package size={16} /> },
  { screen: 'recibos', label: 'Recibos', icon: <Receipt size={16} /> },
  { screen: 'estoque', label: 'Estoque', icon: <Warehouse size={16} /> },
  { screen: 'equipe', label: 'Equipe', icon: <UserCheck size={16} /> },
  { screen: 'relatorios', label: 'Relatórios', icon: <BarChart3 size={16} /> },
  { screen: 'pagamentos', label: 'Pagamentos', icon: <CreditCard size={16} /> },
  { screen: 'configuracoes', label: 'Configurações', icon: <Settings size={16} /> },
  { screen: 'planos', label: isPro ? 'Plano Pro ✓' : 'Assinar Pro', icon: <Crown size={16} /> },
]

interface Props { current: Screen; onNavigate: (s: Screen, id?: string) => void }

export function Sidebar({ current, onNavigate }: Props) {
  const { empresa, isPro, plano } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)

  function nav(s: Screen) { onNavigate(s); setOpen(false) }

  const Content = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo - fixed height */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-white/6">
        <Logo size="sm" />
        {empresa && <p className="text-xs text-purple-300/40 mt-1 truncate">{empresa.nome}</p>}
      </div>

      {/* Nav - scrollable */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto flex flex-col gap-0.5 min-h-0">
        {NAV.map(item => (
          <button key={item.screen} onClick={() => nav(item.screen)}
            className={`nav-item ${current === item.screen ? 'active' : ''}`}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer - fixed */}
      <div className="flex-shrink-0 px-2 py-2 border-t border-white/6">
        <button onClick={toggleTheme} className="nav-item">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          Modo {theme === 'dark' ? 'Claro' : 'Escuro'}
        </button>
        <button onClick={() => signOut()} className="nav-item hover:!text-red-400 hover:!bg-red-500/10">
          <LogOut size={15} /> Sair
        </button>
        <p className="text-xs text-purple-900/60 px-3 mt-1">v4.0 · Proposta Exata</p>
      </div>
    </div>
  )

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2 card text-gray-400 hover:text-white rounded-xl" onClick={() => setOpen(true)}>
        <Menu size={20} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-52 h-full bg-dark-900 border-r border-white/6">
            <button className="absolute top-4 right-3 p-1.5 text-gray-400 hover:text-white" onClick={() => setOpen(false)}><X size={16} /></button>
            <Content />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-52 h-screen sticky top-0 flex-col flex-shrink-0 bg-dark-900 border-r border-white/6">
        <Content />
      </aside>
    </>
  )
}
