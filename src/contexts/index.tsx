import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getEmpresa } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthCtx {
  user: User | null
  empresa: any
  loading: boolean
  empresaLoading: boolean
  refreshEmpresa: () => Promise<void>
  setEmpresa: (e: any) => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [empresaLoading, setEmpresaLoading] = useState(false)

  async function loadEmpresa(uid: string) {
    setEmpresaLoading(true)
    const e = await getEmpresa(uid)
    setEmpresa(e)
    setEmpresaLoading(false)
  }

  async function refreshEmpresa() {
    if (user) await loadEmpresa(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) loadEmpresa(u.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) loadEmpresa(u.id)
      else setEmpresa(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, empresa, loading, empresaLoading, refreshEmpresa, setEmpresa }}>
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
