import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  localeFormat?: boolean;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  localeFormat = false,
  className = '',
}) => {
  const [display, setDisplay] = useState<number>(value);
  const currentRef = useRef<number>(value);

  useEffect(() => {
    const startVal = currentRef.current;
    const endVal = value;
    if (Math.abs(endVal - startVal) < 0.001) {
      setDisplay(endVal);
      currentRef.current = endVal;
      return;
    }

    let raf = 0;
    const startTime = performance.now();
    const duration = 420;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startVal + (endVal - startVal) * eased;
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        currentRef.current = endVal;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const rounded = Number(display.toFixed(decimals));
  const formatted = localeFormat
    ? rounded.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : rounded.toFixed(decimals);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export function formatRulCountdown(rulHours: number, secondOffset = 0): string {
  const totalSeconds = Math.max(60, Math.round(rulHours * 3600) - (secondOffset % 60));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return `~${hrs}h ${String(mins).padStart(2, '0')}m`;
}
