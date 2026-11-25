import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'coral' | 'sage' | 'amber' | 'outline' | 'default';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center font-medium rounded-full tracking-wide transition-colors';

  const variants = {
    default: 'bg-white/10 text-[#E2DFD6] border border-white/10',
    forest: 'bg-[#2D6A4F]/35 text-[#95D5B2] border border-[#52B788]/40 shadow-[0_0_12px_rgba(82,183,136,0.15)]',
    coral: 'bg-[#E07A5F]/25 text-[#EB9A85] border border-[#EB9A85]/40 shadow-[0_0_12px_rgba(224,122,95,0.15)]',
    sage: 'bg-[#172B20] text-[#95D5B2] border border-[#95D5B2]/30',
    amber: 'bg-[#D4A373]/25 text-[#E0BA94] border border-[#D4A373]/40 shadow-[0_0_12px_rgba(212,163,115,0.15)]',
    outline: 'border border-white/20 text-[#A6A49C] bg-white/[0.03]',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </span>
  );
};
