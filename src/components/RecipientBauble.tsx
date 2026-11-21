import React from 'react';

interface RecipientBaubleProps {
  name: string;
  bg: string;
  text: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RecipientBauble: React.FC<RecipientBaubleProps> = ({
  name,
  bg,
  text,
  size = 'md',
}) => {
  const dims =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
        ? 'w-10 h-10 text-base'
        : 'w-9 h-9 text-sm';

  return (
    <span aria-hidden="true" className="relative inline-flex items-center justify-center shrink-0 pt-1">
      {/* Tiny gold ornament cap */}
      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-1.5 rounded-t-xs bg-[#E8B229] border border-[#C58E12]" />
      <span
        className={`relative inline-flex items-center justify-center rounded-full font-serif font-semibold shadow-xs ${dims}`}
        style={{
          backgroundColor: bg,
          color: text,
        }}
      >
        {/* Tiny glossy bauble sheen */}
        <span className="absolute top-1.5 left-1.5 w-2 h-1.5 rounded-full bg-white/30 rotate-[-25deg]" />
        <span className="relative">{name.charAt(0).toUpperCase()}</span>
      </span>
    </span>
  );
};
