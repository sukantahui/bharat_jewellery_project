import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClass = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-slate-400">
      <div className="relative">
        <Loader2 className={`${sizeClass} animate-spin text-amber-500`} />
        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
      </div>
      {message && <p className="text-xs uppercase tracking-widest font-mono font-medium text-amber-400/80">{message}</p>}
    </div>
  );
};
