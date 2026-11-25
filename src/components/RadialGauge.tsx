import React from 'react';
import type { RiskLevel } from '../lib/types';

interface RadialGaugeProps {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  darkSurface?: boolean;
  riskLevel?: RiskLevel;
  label?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  size = 84,
  strokeWidth = 8,
  darkSurface = false,
  riskLevel,
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 70
      ? '#B3265E'
      : clamped >= 35
        ? '#8B79C2'
        : darkSurface
          ? '#E6FF3D'
          : '#5E4B9A';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label || 'Failure probability'}: ${clamped.toFixed(1)}%${riskLevel ? `, ${riskLevel} risk` : ''}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={darkSurface ? 'stroke-white/15' : 'stroke-[#E4DACB] dark:stroke-[#3E3163]'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono font-bold tabular-nums leading-none ${
            darkSurface ? 'text-[#FBF8F2]' : 'text-[#231A3B] dark:text-[#F4EEE4]'
          }`}
          style={{
            fontSize: size >= 140 ? '1.85rem' : size >= 100 ? '1.25rem' : '0.95rem',
          }}
        >
          {clamped.toFixed(0)}%
        </span>
        {size >= 110 && (
          <span
            className={`mt-1 text-[11px] font-medium tracking-wide ${
              darkSurface ? 'text-[#F4EEE4]/75' : 'text-[#5E4B9A] dark:text-[#C5B8E6]'
            }`}
          >
            {riskLevel || 'Risk'}
          </span>
        )}
      </div>
    </div>
  );
};
