import React from 'react';

const FLAKES = [
  { left: '4%', size: 10, duration: '15s', delay: '-2s' },
  { left: '12%', size: 7, duration: '19s', delay: '-8s' },
  { left: '21%', size: 12, duration: '17s', delay: '-5s' },
  { left: '31%', size: 8, duration: '21s', delay: '-11s' },
  { left: '42%', size: 9, duration: '16s', delay: '-3s' },
  { left: '53%', size: 11, duration: '18s', delay: '-14s' },
  { left: '64%', size: 7, duration: '20s', delay: '-6s' },
  { left: '74%', size: 12, duration: '15s', delay: '-9s' },
  { left: '84%', size: 8, duration: '22s', delay: '-4s' },
  { left: '93%', size: 10, duration: '17s', delay: '-12s' },
];

export const SnowfallBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {FLAKES.map((flake, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          className="snowflake-drift absolute top-0 text-[#D8E7F2]"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" />
        </svg>
      ))}
    </div>
  );
};
