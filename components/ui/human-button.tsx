import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const humanButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.98]',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200/60',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400',
        ghost: 'text-gray-700 hover:bg-gray-100/60 hover:text-gray-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.98]',
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.98]',
        link: 'text-blue-600 underline-offset-2 hover:underline hover:text-blue-700',
        subtle: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100',
      },
      size: {
        xs: 'h-7 px-3 text-xs',
        sm: 'h-8 px-4 text-sm',
        md: 'h-9 px-5 text-sm',
        lg: 'h-10 px-6 text-base',
        xl: 'h-11 px-8 text-lg',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
    },
  }
);

export interface HumanButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof humanButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const HumanButton = React.forwardRef<HTMLButtonElement, HumanButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(humanButtonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="h-4 w-4 animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className={cn(loading && 'opacity-70')}>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);
HumanButton.displayName = 'HumanButton';

export { HumanButton, humanButtonVariants };
