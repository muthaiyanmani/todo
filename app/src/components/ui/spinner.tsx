import { cn } from "../../lib/utils";

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-muted-foreground border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingButton({ 
  children, 
  isLoading, 
  className,
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}