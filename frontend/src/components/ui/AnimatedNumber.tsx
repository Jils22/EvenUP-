import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 1000, 
  format = (val) => val.toFixed(2),
  className 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: outQuart
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      
      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span className={className}>{format(displayValue)}</span>;
}
