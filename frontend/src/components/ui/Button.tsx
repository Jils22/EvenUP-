import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const BaseButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[20px] text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
BaseButton.displayName = "BaseButton";

export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(
        "bg-primary text-white shadow-[0_4px_20px_rgba(192,143,245,0.25)] hover:bg-primary/90 hover:shadow-[0_6px_25px_rgba(192,143,245,0.35)] px-6 py-3",
        className
      )}
      {...props}
    />
  )
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(
        "bg-card text-white border border-border-soft hover:bg-white/5 hover:border-white/20 px-6 py-3",
        className
      )}
      {...props}
    />
  )
);
SecondaryButton.displayName = "SecondaryButton";

export const DangerButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <BaseButton
      ref={ref}
      className={cn(
        "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 hover:border-danger/30 px-6 py-3",
        className
      )}
      {...props}
    />
  )
);
DangerButton.displayName = "DangerButton";
