import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'coral';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#05120B] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-gradient-to-r from-[#2D7554] to-[#1A4D36] text-[#FFFDF7] border border-[#74C69D]/45 hover:border-[#95D5B2]/75 hover:shadow-[0_0_28px_rgba(82,183,136,0.38)] focus:ring-[#52B788]',
      gold: 'btn-champagne focus:ring-[#E8C97A]',
      secondary: 'bg-[#143626]/90 text-[#B7E4C7] border border-[#52B788]/30 hover:bg-[#1B4934] hover:text-[#FFFDF7] focus:ring-[#52B788]',
      outline: 'border border-[#E8C97A]/25 bg-[#0A1E15]/60 text-[#FFFDF7] hover:bg-[#123324]/80 hover:border-[#E8C97A]/50 focus:ring-[#E8C97A] backdrop-blur-md',
      ghost: 'text-[#A7E4C4] hover:bg-[#2D6A4F]/25 hover:text-[#FFFDF7] focus:ring-[#52B788]',
      coral: 'bg-gradient-to-r from-[#E07A5F] to-[#C85A3D] text-[#FFFDF7] border border-[#EB9A85]/40 hover:border-[#EB9A85]/70 hover:shadow-[0_0_25px_rgba(224,122,95,0.35)] focus:ring-[#E07A5F]',
    };

    const sizes = {
      sm: 'text-xs px-4 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-sm sm:text-base px-7 py-3.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(base, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
