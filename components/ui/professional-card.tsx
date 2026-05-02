import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProfessionalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
}

const ProfessionalCard = React.forwardRef<HTMLDivElement, ProfessionalCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200/60 shadow-sm',
      glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg',
      elevated: 'bg-white border border-gray-200/40 shadow-xl',
      bordered: 'bg-white border-2 border-gray-200/80 shadow-md',
    };

    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200 hover:shadow-lg',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProfessionalCard.displayName = 'ProfessionalCard';

const ProfessionalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6 border-b border-gray-100/60', className)}
    {...props}
  />
));
ProfessionalCardHeader.displayName = 'ProfessionalCardHeader';

const ProfessionalCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold tracking-tight text-gray-900',
      className
    )}
    {...props}
  />
));
ProfessionalCardTitle.displayName = 'ProfessionalCardTitle';

const ProfessionalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 leading-relaxed', className)}
    {...props}
  />
));
ProfessionalCardDescription.displayName = 'ProfessionalCardDescription';

const ProfessionalCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-6', className)} {...props} />
));
ProfessionalCardContent.displayName = 'ProfessionalCardContent';

const ProfessionalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6 border-t border-gray-100/60', className)}
    {...props}
  />
));
ProfessionalCardFooter.displayName = 'ProfessionalCardFooter';

export {
  ProfessionalCard,
  ProfessionalCardHeader,
  ProfessionalCardFooter,
  ProfessionalCardTitle,
  ProfessionalCardDescription,
  ProfessionalCardContent,
};
