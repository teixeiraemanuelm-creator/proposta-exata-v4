import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { Btn, Input } from '@/components/ui'
import { signInEmail, signInGoogle, signUp, criarEmpresa } from '@/lib/supabase'
import { useAuth } from '@/contexts'
import { Building2, ArrowRight } from 'lucide-react'

export function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signInEmail(email, password)
      if (error) setError('Email ou senha incorretos.')
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setSuccess('Conta criada! Verifique seu email.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGLoading(true)
    await signInGoogle()
    setGLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        <div className="card p-7">
          <h1 className="text-xl font-bold text-white mb-1">{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h1>
          <p className="text-sm text-gray-500 mb-6">{mode === 'login' ? 'Bem-vindo de volta!' : 'Comece a usar o Proposta Exata'}</p>

          <Btn variant="secondary" full size="lg" loading={gLoading} onClick={handleGoogle}
            icon={<svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.618 14.215 17.64 11.907 17.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>}>
            Continuar com Google
          </Btn>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-gray-600">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" required hint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined} />
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400">{success}</div>}
            <Btn type="submit" full size="lg" loading={loading}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Btn>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const { user, refreshEmpresa } = useAuth()
  const [form, setForm] = useState({ nome: '', cnpj: '', telefone: '', email: user?.email ?? '', cidade: '', estado: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function f(p: any) { setForm(prev => ({ ...prev, ...p })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.nome.trim()) return
    setLoading(true)
    const emp = await criarEmpresa(form, user.id)
    if (!emp) { setError('Erro ao criar empresa.'); setLoading(false); return }
    await refreshEmpresa()
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size="md" /></div>
        <div className="card p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-500"><Building2 size={20} /></div>
            <div><h1 className="text-lg font-bold text-white">Configure sua empresa</h1><p className="text-xs text-gray-500">Dados que aparecerão nos orçamentos</p></div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="Nome da empresa *" value={form.nome} onChange={(e: any) => f({ nome: e.target.value })} placeholder="Minha Empresa Ltda." required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="CNPJ" value={form.cnpj} onChange={(e: any) => f({ cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
              <Input label="Telefone/WhatsApp" value={form.telefone} onChange={(e: any) => f({ telefone: e.target.value })} placeholder="(16) 98116-4639" />
            </div>
            <Input label="Email" value={form.email} onChange={(e: any) => f({ email: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Input label="Cidade" value={form.cidade} onChange={(e: any) => f({ cidade: e.target.value })} placeholder="Ribeirão Preto" /></div>
              <Input label="UF" value={form.estado} onChange={(e: any) => f({ estado: e.target.value })} placeholder="SP" maxLength={2} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Btn type="submit" full size="lg" loading={loading} icon={<ArrowRight size={16} />}>Criar empresa e entrar</Btn>
          </form>
        </div>
      </div>
    </div>
  )
}
