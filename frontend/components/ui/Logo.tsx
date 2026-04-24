import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ size = 28, className = '', style }: LogoProps) {
  const borderRadius = Math.max(6, Math.floor(size * 0.25));
  const svgSize = Math.floor(size * 0.56);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: '#fff',
        borderRadius: `${borderRadius}px`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg 
        width={svgSize} 
        height={svgSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#000" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ display: 'block' }}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
  );
}
