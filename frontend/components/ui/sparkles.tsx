'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function SparklesCore({
  background,
  minSize,
  maxSize,
  particleDensity,
  className,
  particleColor
}: {
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
}) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const density = particleDensity ? Math.min(particleDensity / 10, 100) : 50;
    const newParticles = Array.from({ length: density }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * ((maxSize || 2) - (minSize || 1)) + (minSize || 1),
      duration: Math.random() * 2 + 1,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [maxSize, minSize, particleDensity]);

  return (
    <div className={className} style={{ position: 'relative', background }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [p.y + '%', p.y - 10 + '%']
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            left: p.x + '%',
            top: p.y + '%',
            width: p.size,
            height: p.size,
            backgroundColor: particleColor || '#fff',
            borderRadius: '50%'
          }}
        />
      ))}
    </div>
  );
}
