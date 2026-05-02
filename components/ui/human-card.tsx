import * as React from 'react';
import { cn } from '@/lib/utils';

interface HumanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warm' | 'subtle' | 'organic';
  padding?: 'cozy' | 'comfortable' | 'spacious';
}

const HumanCard = React.forwardRef<HTMLDivElement, HumanCardProps>(
  ({ className, variant = 'default', padding = 'comfortable', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
      warm: 'bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200',
      subtle: 'bg-gray-50/80 border border-gray-100/50 hover:bg-gray-50 transition-colors duration-150',
      organic: 'bg-white/95 backdrop-blur-[1px] border border-gray-200/60 hover:border-gray-200/80 transition-all duration-200',
    };

    const paddings = {
      cozy: 'p-4',
      comfortable: 'p-6',
      spacious: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
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
HumanCard.displayName = 'HumanCard';

const HumanCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 pb-4 border-b border-gray-100/60', className)}
    {...props}
  />
));
HumanCardHeader.displayName = 'HumanCardHeader';

const HumanCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold text-gray-900 leading-tight',
      className
    )}
    {...props}
  />
));
HumanCardTitle.displayName = 'HumanCardTitle';

const HumanCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 leading-relaxed', className)}
    {...props}
  />
));
HumanCardDescription.displayName = 'HumanCardDescription';

const HumanCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));
HumanCardContent.displayName = 'HumanCardContent';

const HumanCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between pt-4 border-t border-gray-100/60', className)}
    {...props}
  />
));
HumanCardFooter.displayName = 'HumanCardFooter';

export {
  HumanCard,
  HumanCardHeader,
  HumanCardFooter,
  HumanCardTitle,
  HumanCardDescription,
  HumanCardContent,
};
