import { useTheme } from '@/contexts'

export function Logo({ size = 'md', className = '' }: { size?: 'sm'|'md'|'lg'; className?: string }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const h = { sm: 'h-8', md: 'h-10', lg: 'h-14' }[size]

  const c1 = isLight ? '#93C5FD' : '#FFB347'
  const c2 = isLight ? '#2563EB' : '#F97316'
  const c3 = isLight ? '#1D4ED8' : '#C2410C'
  const c4 = isLight ? '#BFDBFE' : '#FED7AA'
  const c5 = isLight ? '#1E40AF' : '#7C2D12'
  const textMain = isLight ? '#1a1829' : '#FFFFFF'
  const textAccent = isLight ? '#2563EB' : '#F97316'

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" className={`${h} w-auto ${className}`}>
      <polygon points="18,8 42,8 82,72 58,72" fill="url(#ga)" />
      <polygon points="58,8 82,8 42,72 18,72" fill="url(#gb)" />
      <polygon points="42,8 58,8 50,22 34,22" fill="url(#gt)" />
      <polygon points="34,58 50,58 58,72 42,72" fill="url(#gbot)" />
      <text x="96" y="34" fontFamily="'Plus Jakarta Sans',Arial,sans-serif" fontWeight="800" fontSize="18" fill={textMain} letterSpacing="-0.5">Proposta</text>
      <text x="96" y="58" fontFamily="'Plus Jakarta Sans',Arial,sans-serif" fontWeight="800" fontSize="18" fill={textAccent} letterSpacing="-0.5">Exata</text>
      <defs>
        <linearGradient id="ga" x1="18" y1="8" x2="82" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c1}/><stop offset="50%" stopColor={c2}/><stop offset="100%" stopColor={c3}/>
        </linearGradient>
        <linearGradient id="gb" x1="82" y1="8" x2="18" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c3}/><stop offset="50%" stopColor={c2}/><stop offset="100%" stopColor={c1}/>
        </linearGradient>
        <linearGradient id="gt" x1="42" y1="8" x2="58" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c4}/><stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <linearGradient id="gbot" x1="34" y1="58" x2="58" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c2}/><stop offset="100%" stopColor={c5}/>
        </linearGradient>
      </defs>
    </svg>
  )
}
