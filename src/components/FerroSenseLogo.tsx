import React from 'react';

interface FerroSenseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

/**
 * Custom geometric industrial FerroSense brand mark:
 * Deep plum chamfered precision shield, heather purple gear/spindle ring,
 * and electric lemon predictive heartbeat waveform with telemetry node.
 */
export const FerroSenseLogo: React.FC<FerroSenseLogoProps> = ({
  size = 'sm',
  animated = false,
  className = '',
}) => {
  const px = size === 'lg' ? 68 : size === 'md' ? 44 : 34;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Chamfered industrial shield background */}
      <path
        d="M14 4H50L60 14V50L50 60H14L4 50V14L14 4Z"
        fill="#231A3B"
        stroke="#8B79C2"
        strokeWidth="2.2"
      />

      {/* Precision spindle / gear ring */}
      <circle
        cx="32"
        cy="32"
        r="19"
        stroke="#8B79C2"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <circle
        cx="32"
        cy="32"
        r="13.5"
        stroke="#5E4B9A"
        strokeWidth="1.6"
      />

      {/* Cardinal precision tick notches */}
      <line x1="32" y1="9" x2="32" y2="14" stroke="#8B79C2" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="50" x2="32" y2="55" stroke="#8B79C2" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="32" x2="14" y2="32" stroke="#8B79C2" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="32" x2="55" y2="32" stroke="#8B79C2" strokeWidth="2" strokeLinecap="round" />

      {/* Electric Lemon predictive waveform */}
      <path
        d="M12 36H21L26 22L32.5 42L38.5 27L43 36H52"
        stroke="#E6FF3D"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Telemetry peak pulse node */}
      {animated && (
        <circle cx="38.5" cy="27" r="6" fill="#E6FF3D" fillOpacity="0.24">
          <animate
            attributeName="r"
            values="4;8;4"
            dur="2.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.38;0.08;0.38"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle cx="38.5" cy="27" r="3.2" fill="#E6FF3D" />
    </svg>
  );
};
