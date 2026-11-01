import React, { useId } from 'react'

interface BrandSymbolProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
  darkBackground?: boolean
}

/**
 * CodeCraft Brand Symbol
 * 
 * An original geometric emblem combining craftsmanship, Python logic, and timeless geometry.
 * Composed of an architectural C formed by two faceted metallic ribbon arcs embracing
 * an internal forward logic chevron ('>') and precision core spark.
 */
export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 24,
  className,
  darkBackground = false,
  ...props
}) => {
  const uid = useId().replace(/:/g, '')

  const zenithGradId = `zenith-${uid}`
  const keelGradId = `keel-${uid}`
  const chevronGradId = `chevron-${uid}`
  const sparkGradId = `spark-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Upper Zenith Arc: Champagne light to warm bronze */}
        <linearGradient id={zenithGradId} x1="120" y1="76" x2="420" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="22%" stopColor="#F4F0E8" />
          <stop offset="60%" stopColor="#D8B58B" />
          <stop offset="100%" stopColor="#B8895B" />
        </linearGradient>

        {/* Lower Keel Arc: Polished gold to deep burnished bronze */}
        <linearGradient id={keelGradId} x1="120" y1="436" x2="420" y2="322" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#693C18" />
          <stop offset="35%" stopColor="#8E5B2F" />
          <stop offset="75%" stopColor="#B8895B" />
          <stop offset="100%" stopColor="#D8B58B" />
        </linearGradient>

        {/* Forward Logic Chevron: Luminous forward direction */}
        <linearGradient id={chevronGradId} x1="190" y1="200" x2="370" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="35%" stopColor="#F4F0E8" />
          <stop offset="75%" stopColor="#D8B58B" />
          <stop offset="100%" stopColor="#B8895B" />
        </linearGradient>

        {/* Diamond Spark Core */}
        <linearGradient id={sparkGradId} x1="375" y1="230" x2="425" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="45%" stopColor="#F4F0E8" />
          <stop offset="80%" stopColor="#D8B58B" />
          <stop offset="100%" stopColor="#8E5B2F" />
        </linearGradient>
      </defs>

      {darkBackground && (
        <>
          <rect width="512" height="512" rx="104" fill="#191815" />
          <rect width="510" height="510" x="1" y="1" rx="103" fill="none" stroke="rgba(216, 181, 139, 0.15)" strokeWidth="2" />
        </>
      )}

      <g id={`brand-symbol-${uid}`}>
        {/* Upper Zenith Arc */}
        <path
          d="M 406 136 C 366 84 306 56 238 56 C 142 56 82 126 82 224 C 82 234 83 244 85 254 L 156 232 C 155 229 154 226 154 224 C 154 166 190 126 244 126 C 286 126 322 146 346 178 Z"
          fill={`url(#${zenithGradId})`}
        />

        {/* Lower Keel Arc */}
        <path
          d="M 406 376 L 346 334 C 322 366 286 386 244 386 C 190 386 154 346 154 288 C 154 286 155 283 156 280 L 85 258 C 83 268 82 278 82 288 C 82 386 142 456 238 456 C 306 456 366 428 406 376 Z"
          fill={`url(#${keelGradId})`}
        />

        {/* Forward Logic Chevron ('>') */}
        <path
          d="M 212 256 L 290 184 L 340 222 L 280 256 L 340 290 L 290 328 Z"
          fill={`url(#${chevronGradId})`}
        />

        {/* Precision Diamond Spark */}
        <path
          d="M 382 256 L 406 232 L 430 256 L 406 280 Z"
          fill={`url(#${sparkGradId})`}
        />
      </g>
    </svg>
  )
}

