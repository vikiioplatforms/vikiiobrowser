interface ShieldIconProps {
  color?: 'green' | 'yellow' | 'red'
  size?: number
}

const COLORS = {
  green: '#4caf7d',
  yellow: '#f5a623',
  red: '#e05252',
}

export function ShieldIcon({ color = 'green', size = 16 }: ShieldIconProps) {
  const c = COLORS[color]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5L2 4v4c0 3.3 2.5 6.3 6 7 3.5-.7 6-3.7 6-7V4L8 1.5z"
        stroke={c}
        strokeWidth="1.4"
        fill={c}
        fillOpacity="0.15"
        strokeLinejoin="round"
      />
      {color === 'green' && (
        <path d="M5.5 8l2 2 3-3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {color === 'yellow' && (
        <path d="M8 5.5v3M8 10.5v.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      )}
      {color === 'red' && (
        <path d="M6 6l4 4M10 6L6 10" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      )}
    </svg>
  )
}
