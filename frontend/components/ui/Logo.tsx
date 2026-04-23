import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ size = 28, className = '', style }: LogoProps) {
  // Use Tailwind's neutral-800 (#262626) as requested
  const borderRadius = Math.max(6, Math.floor(size * 0.25)); // Scale border radius with size
  const fontSize = Math.max(14, Math.floor(size * 0.55)); // Scale font size

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: '#262626', // bg-neutral-800
        borderRadius: `${borderRadius}px`,
        color: '#ffffff',
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        fontFamily: 'var(--font-display, var(--font-sans, system-ui))',
        ...style,
      }}
    >
      C
    </div>
  );
}
