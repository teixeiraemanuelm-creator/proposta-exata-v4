export function Logo({ size = 'md', className = '' }: { size?: 'sm'|'md'|'lg'; className?: string }) {
  const h = { sm: 'h-8', md: 'h-10', lg: 'h-14' }[size]
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" className={`${h} w-auto ${className}`}>
      <polygon points="18,8 42,8 82,72 58,72" fill="url(#ga)" />
      <polygon points="58,8 82,8 42,72 18,72" fill="url(#gb)" />
      <polygon points="42,8 58,8 50,22 34,22" fill="url(#gt)" />
      <polygon points="34,58 50,58 58,72 42,72" fill="url(#gbot)" />
      <text x="96" y="34" fontFamily="'Plus Jakarta Sans',Arial,sans-serif" fontWeight="800" fontSize="18" fill="#FFFFFF" letterSpacing="-0.5">Proposta</text>
      <text x="96" y="58" fontFamily="'Plus Jakarta Sans',Arial,sans-serif" fontWeight="800" fontSize="18" fill="#F97316" letterSpacing="-0.5">Exata</text>
      <defs>
        <linearGradient id="ga" x1="18" y1="8" x2="82" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB347"/><stop offset="50%" stopColor="#F97316"/><stop offset="100%" stopColor="#C2410C"/>
        </linearGradient>
        <linearGradient id="gb" x1="82" y1="8" x2="18" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C2410C"/><stop offset="50%" stopColor="#F97316"/><stop offset="100%" stopColor="#FFB347"/>
        </linearGradient>
        <linearGradient id="gt" x1="42" y1="8" x2="58" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA"/><stop offset="100%" stopColor="#F97316"/>
        </linearGradient>
        <linearGradient id="gbot" x1="34" y1="58" x2="58" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316"/><stop offset="100%" stopColor="#7C2D12"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
