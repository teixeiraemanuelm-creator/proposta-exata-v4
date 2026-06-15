import React, { useCallback, useRef, useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

export function Btn({ children, variant = 'primary', size = 'md', loading, icon, full, className = '', ...rest }: {
  children?: React.ReactNode; variant?: 'primary'|'secondary'|'ghost'|'danger'|'success'|'whatsapp'
  size?: 'sm'|'md'|'lg'; loading?: boolean; icon?: React.ReactNode; full?: boolean
  className?: string; [k: string]: any
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold transition-all rounded-lg border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none'
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-sm px-5 py-2.5' }
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-white/7 text-gray-200 hover:bg-white/12 border border-white/10',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20',
    success: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20',
    whatsapp: 'bg-green-600 text-white hover:bg-green-700',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`} disabled={loading} {...rest}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function Input({ label, error, hint, prefix, suffix, className = '', id, ...rest }: {
  label?: string; error?: string; hint?: string; prefix?: string; suffix?: string
  className?: string; id?: string; [k: string]: any
}) {
  const fid = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={fid} className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-xs text-gray-500 pointer-events-none">{prefix}</span>}
        <input id={fid} className={`field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''} ${error ? '!border-red-500/50' : ''} ${className}`} {...rest} />
        {suffix && <span className="absolute right-3 text-xs text-gray-500 pointer-events-none">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', id, ...rest }: {
  label?: string; error?: string; className?: string; id?: string; [k: string]: any
}) {
  const fid = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={fid} className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">{label}</label>}
      <textarea id={fid} rows={3} className={`field resize-none ${error ? '!border-red-500/50' : ''} ${className}`} {...rest} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, error, options, className = '', id, ...rest }: {
  label?: string; error?: string; options: { value: string; label: string }[]
  className?: string; id?: string; [k: string]: any
}) {
  const fid = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={fid} className="text-xs font-semibold text-purple-300/60 uppercase tracking-wider">{label}</label>}
      <select id={fid} className={`field cursor-pointer ${error ? '!border-red-500/50' : ''} ${className}`} style={{ background: '#1a1829' }} {...rest}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1829' }}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode
  size?: 'sm'|'md'|'lg'|'xl'
}) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} card max-h-[92vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h3 className="font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><X size={16} /></button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function Badge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
    recusado: 'Recusado', cancelado: 'Cancelado',
  }
  return <span className={`badge badge-${status}`}>{labels[status] ?? status}</span>
}

export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-brand-500" />
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-purple-300/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600">{icon}</div>
      <div><p className="font-semibold text-gray-300">{title}</p><p className="text-sm text-gray-500 mt-0.5">{desc}</p></div>
      {action}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; msg: string; type: ToastType }

let _addToast: ((msg: string, type: ToastType) => void) | null = null

export function toast(msg: string, type: ToastType = 'info') {
  _addToast?.(msg, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const add = useCallback((msg: string, type: ToastType) => {
    const id = ++counter.current
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  useEffect(() => { _addToast = add; return () => { _addToast = null } }, [add])

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
    error: <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />,
    info: <Info size={16} className="text-blue-400 flex-shrink-0" />,
  }

  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-2.5 bg-dark-800 border border-white/10 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 max-w-sm pointer-events-auto">
          {icons[t.type]}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
interface ConfirmOptions { title?: string; message: string; confirmLabel?: string; danger?: boolean }

let _openConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null

export function confirm(message: string, opts?: Partial<ConfirmOptions>): Promise<boolean> {
  if (_openConfirm) return _openConfirm({ message, ...opts })
  return Promise.resolve(window.confirm(message))
}

export function ConfirmProvider() {
  const [state, setState] = useState<{ open: boolean; opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  useEffect(() => {
    _openConfirm = (opts) => new Promise<boolean>(resolve => {
      setState({ open: true, opts, resolve })
    })
    return () => { _openConfirm = null }
  }, [])

  if (!state?.open) return null

  function handle(v: boolean) {
    state!.resolve(v)
    setState(null)
  }

  const { opts } = state
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => handle(false)} />
      <div className="relative w-full max-w-sm bg-[#13121f] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${opts.danger ? 'bg-red-500/15' : 'bg-orange-500/15'}`}>
            <AlertTriangle size={20} className={opts.danger ? 'text-red-400' : 'text-orange-400'} />
          </div>
          <div>
            {opts.title && <p className="font-black text-white mb-1">{opts.title}</p>}
            <p className="text-sm text-gray-400">{opts.message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handle(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => handle(true)}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${opts.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-500 hover:bg-orange-400'}`}
          >
            {opts.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

