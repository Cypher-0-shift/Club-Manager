'use client';
import { useEffect, useState } from 'react';

export function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = to / (duration / 16);
    let handle: number;
    
    const step = () => {
      start += increment;
      if (start < to) {
        setCount(Math.ceil(start));
        handle = requestAnimationFrame(step);
      } else {
        setCount(to);
      }
    };
    
    handle = requestAnimationFrame(step);
    return () => cancelAnimationFrame(handle);
  }, [to, duration]);

  return <span>{count}</span>;
}
