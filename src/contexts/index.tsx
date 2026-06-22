import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getEmpresa, getAssinatura, verificarEAtivarPendente } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'admin' | 'vendedor' | 'visualizador'

interface AuthCtx {
  user: User | null
  empresa: any
  role: UserRole | null
  assinatura: any
  plano: 'free' | 'pro'
  loading: boolean
  empresaLoading: boolean
  refreshEmpresa: () => Promise<void>
  refreshAssinatura: () => Promise<void>
  setEmpresa: (e: any) => void
  // helpers de permissão
  podeEditar: boolean
  podeGerenciar: boolean
  isOwner: boolean
  isPro: boolean
  isLifetime: boolean
  isFundador: boolean
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [empresa, setEmpresa] = useState<any>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [assinatura, setAssinatura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [empresaLoading, setEmpresaLoading] = useState(false)

  async function loadEmpresa(uid: string, userEmail?: string) {
    setEmpresaLoading(true)
    const result = await getEmpresa(uid)
    const emp = result?.empresa ?? null
    setEmpresa(emp)
    setRole(result?.role ?? null)
    if (emp?.id) {
      // Verifica se há pagamento pendente (Fundadores / Pix) e ativa automaticamente
      if (userEmail) {
        const planoAtivado = await verificarEAtivarPendente(emp.id, userEmail)
        if (planoAtivado) {
          const { data: ass } = await getAssinatura(emp.id)
          setAssinatura(ass ?? { plano: 'free', status: 'ativo' })
          setEmpresaLoading(false)
          return
        }
      }
      const { data: ass } = await getAssinatura(emp.id)
      setAssinatura(ass ?? { plano: 'free', status: 'ativo' })
    }
    setEmpresaLoading(false)
  }

  async function refreshAssinatura() {
    if (empresa?.id) {
      const { data: ass } = await getAssinatura(empresa.id)
      setAssinatura(ass ?? { plano: 'free', status: 'ativo' })
    }
  }

  async function refreshEmpresa() {
    if (user) await loadEmpresa(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) loadEmpresa(u.id, u.email)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) {
        loadEmpresa(u.id, u.email)
        // Envia email de boas-vindas no primeiro login via Google OAuth
        if (event === 'SIGNED_IN' && u.app_metadata?.provider === 'google') {
          const jaEnviou = localStorage.getItem(`pe_welcome_${u.id}`)
          if (!jaEnviou) {
            localStorage.setItem(`pe_welcome_${u.id}`, '1')
            fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar-boas-vindas`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({
                  email: u.email,
                  nome: u.user_metadata?.full_name ?? u.email,
                  empresa: u.user_metadata?.full_name ?? '',
                }),
              }
            ).catch(() => {/* silencioso */})
          }
        }
      } else {
        setEmpresa(null)
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const podeEditar = role !== null && role !== 'visualizador'
  const podeGerenciar = role === 'owner' || role === 'admin'
  const isOwner = role === 'owner'
  const isLifetime = assinatura?.plano === 'lifetime' && assinatura?.status === 'ativo'
  const plano: 'free' | 'pro' = (assinatura?.plano === 'pro' || isLifetime) && assinatura?.status === 'ativo' ? 'pro' : 'free'
  const isPro = plano === 'pro' || isLifetime
  const isFundador = empresa?.fundador === true || isLifetime

  return (
    <AuthContext.Provider value={{
      user, empresa, role, assinatura, plano, loading, empresaLoading,
      refreshEmpresa, refreshAssinatura, setEmpresa,
      podeEditar, podeGerenciar, isOwner, isPro, isLifetime, isFundador,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

// Theme
interface ThemeCtx { theme: 'dark' | 'light'; toggleTheme: () => void }
const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('pe_theme') as 'dark' | 'light') ?? 'dark'
  )

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light-mode')
      document.body.style.background = '#0f0e17'
      document.body.style.color = 'white'
      document.body.className = ''
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light-mode')
      document.body.style.background = '#f0f2f8'
      document.body.style.color = '#1a1829'
      document.body.className = 'light-mode'
    }
    localStorage.setItem('pe_theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
