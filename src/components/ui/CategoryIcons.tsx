export default function CategoryIcons({ type, className = '' }: { type: 'groundnut' | 'coconut' | 'sesame' | 'castor' | 'deepam', className?: string }) {
  if (type === 'groundnut') {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <path d="M30 50 Q30 30 50 20 Q70 30 70 50 Q70 65 60 75 Q50 85 40 75 Q30 65 30 50 Z" fill="#c9a227" />
        <path d="M40 40 Q50 35 60 40" stroke="#ab871b" fill="none" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="55" r="4" fill="#ab871b" />
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="3s" repeatCount="indefinite" />
      </svg>
    );
  }

  if (type === 'coconut') {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <circle cx="50" cy="50" r="30" fill="#5D4037" />
        <path d="M30 50 A20 20 0 0 1 70 50" fill="white" />
        <circle cx="45" cy="40" r="3" fill="#3E2723" />
        <circle cx="55" cy="40" r="3" fill="#3E2723" />
        <animateTransform attributeName="transform" type="rotate" values="-5 50 50; 5 50 50; -5 50 50" dur="4s" repeatCount="indefinite" />
      </svg>
    );
  }

  if (type === 'sesame') {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        {Array.from({length: 6}).map((_, i) => (
           <ellipse key={i} cx={40 + i*5} cy={40 + (i%2)*15} rx="3" ry="6" fill="#1b5e20" transform={`rotate(${30*(i+1)} ${40+i*5} ${40+(i%2)*15})`}>
              <animateTransform attributeName="transform" type="scale" values="1; 1.2; 1" dur={`${2+i*0.2}s`} repeatCount="indefinite" />
           </ellipse>
        ))}
        <path d="M50 20 Q30 50 50 80 Q70 50 50 20 Z" fill="none" stroke="#1b5e20" strokeWidth="2" strokeDasharray="4 4">
           <animate attributeName="stroke-dashoffset" values="0; 16" dur="2s" repeatCount="indefinite" />
        </path>
      </svg>
    );
  }

  // Fallback droplet for castor / deepam
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
      <path d="M50 20 Q30 50 30 70 A20 20 0 0 0 70 70 Q70 50 50 20 Z" fill={type === 'castor' ? '#8E24AA' : '#E65100'} />
      <path d="M40 60 A10 10 0 0 0 55 75" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <animateTransform attributeName="transform" type="scale" values="0.95; 1.05; 0.95" dur="2.5s" repeatCount="indefinite" />
    </svg>
  );
}
