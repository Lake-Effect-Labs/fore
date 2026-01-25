'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default:
        'bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a] focus-visible:ring-[#c9a962]',
      secondary:
        'bg-[#004d35] text-[#e8f5f0] hover:bg-[#006747] focus-visible:ring-[#006747]',
      outline:
        'border-2 border-[#004d35] bg-transparent text-[#e8f5f0] hover:bg-[#004d35] focus-visible:ring-[#004d35]',
      ghost:
        'bg-transparent text-[#a8d4c0] hover:bg-[#004d35] hover:text-[#e8f5f0] focus-visible:ring-[#004d35]',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    };

    const sizes = {
      default: 'h-11 px-5 py-2 text-sm',
      sm: 'h-9 px-3 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
