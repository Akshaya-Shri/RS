export default function OilPourHeroSVG({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 400 400" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`w-full h-full drop-shadow-2xl ${className}`}
    >
      <defs>
        <linearGradient id="oilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#efc131" />
          <stop offset="50%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#ab871b" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="splashGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#efc131" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background soft glow */}
      <circle cx="200" cy="200" r="150" fill="url(#splashGrad)" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
        <animate attributeName="r" values="130;160;130" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* The Bottle Outline */}
      <path 
        d="M230 80 L230 40 Q230 30 220 30 L180 30 Q170 30 170 40 L170 80 Q170 110 140 130 L140 330 Q140 360 170 360 L230 360 Q260 360 260 330 L260 130 Q230 110 230 80 Z" 
        fill="none" 
        stroke="#1b5e20" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      <path d="M165 40 L235 40" stroke="#1b5e20" strokeWidth="6" strokeLinecap="round" />
      
      {/* Label */}
      <rect x="145" y="180" width="110" height="80" rx="4" fill="#1b5e20" />
      <circle cx="200" cy="220" r="15" fill="#c9a227" />

      {/* Oil Level inside bottle */}
      <path 
        d="M145 320 Q200 310 255 320 L255 350 Q255 355 230 355 L170 355 Q145 355 145 350 Z" 
        fill="url(#oilGrad)"
      >
        <animate attributeName="d" 
                 values="M145 320 Q200 310 255 320 L255 350 Q255 355 230 355 L170 355 Q145 355 145 350 Z;
                         M145 320 Q200 330 255 320 L255 350 Q255 355 230 355 L170 355 Q145 355 145 350 Z;
                         M145 320 Q200 310 255 320 L255 350 Q255 355 230 355 L170 355 Q145 355 145 350 Z" 
                 dur="3s" repeatCount="indefinite"/>
      </path>

      {/* Oil Pouring Line (Stream) */}
      <g filter="url(#glow)">
        <path d="M190 30 L190 -100" stroke="url(#oilGrad)" strokeWidth="12" strokeLinecap="round" className="animate-pouring" />
        <path d="M210 30 L210 -80" stroke="url(#oilGrad)" strokeWidth="8" strokeLinecap="round" className="animate-pouring" style={{animationDelay: '0.4s'}} />
      </g>
      
      {/* Floating Oil Drops */}
      {[0, 1, 2, 3].map(i => (
        <circle 
          key={i} 
          cx={180 + i * 15} 
          cy="20" 
          r={5 + (i % 3)} 
          fill="url(#oilGrad)"
        >
          <animate 
            attributeName="cy" 
            values=" -20; 60; 120" 
            dur={`${1.5 + i * 0.5}s`} 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="opacity" 
            values="0; 1; 0" 
            dur={`${1.5 + i * 0.5}s`} 
            repeatCount="indefinite" 
          />
        </circle>
      ))}
    </svg>
  );
}
