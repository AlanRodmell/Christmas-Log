import React from 'react';

const BULBS = [
  { cx: 30, cy: 9, color: '#FFD84D', cls: 'fairy-bulb-a' },
  { cx: 88, cy: 11, color: '#4BE08A', cls: 'fairy-bulb-b' },
  { cx: 148, cy: 8, color: '#FF6B78', cls: 'fairy-bulb-a' },
  { cx: 208, cy: 11, color: '#7ED6FF', cls: 'fairy-bulb-b' },
  { cx: 268, cy: 9, color: '#FFD84D', cls: 'fairy-bulb-a' },
  { cx: 328, cy: 11, color: '#4BE08A', cls: 'fairy-bulb-b' },
  { cx: 388, cy: 8, color: '#FF6B78', cls: 'fairy-bulb-a' },
  { cx: 448, cy: 11, color: '#FFD84D', cls: 'fairy-bulb-b' },
  { cx: 508, cy: 9, color: '#7ED6FF', cls: 'fairy-bulb-a' },
  { cx: 568, cy: 11, color: '#4BE08A', cls: 'fairy-bulb-b' },
];

export const FairyLightsTrim: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 right-0 -bottom-[11px] h-[14px] overflow-hidden select-none"
    >
      <svg
        viewBox="0 0 600 16"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d="M0,2 Q60,11 120,3 T240,3 T360,3 T480,3 T600,3"
          fill="none"
          stroke="#0D4027"
          strokeWidth="1.6"
          opacity="0.7"
        />
        {BULBS.map((bulb, i) => (
          <g key={i} className={bulb.cls}>
            <rect x={bulb.cx - 2} y={bulb.cy - 5} width="4" height="3" rx="0.8" fill="#174D32" />
            <ellipse cx={bulb.cx} cy={bulb.cy + 1} rx="4" ry="5" fill={bulb.color} />
            <circle cx={bulb.cx - 1} cy={bulb.cy - 0.5} r="1.1" fill="#FFFFFF" opacity="0.75" />
          </g>
        ))}
      </svg>
    </div>
  );
};
