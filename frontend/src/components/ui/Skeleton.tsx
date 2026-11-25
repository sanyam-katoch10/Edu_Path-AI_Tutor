import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded-xl bg-white/[0.06] border border-white/[0.04]', className)
      )}
      {...props}
    />
  );
};
