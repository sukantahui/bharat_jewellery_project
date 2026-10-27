import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'silver' | 'emerald' | 'ruby' | 'slate' | 'blue' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    gold: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    silver: 'bg-slate-300/15 text-slate-200 border border-slate-300/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    ruby: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    blue: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    amber: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium tracking-wide',
    md: 'text-sm px-3 py-1 rounded-full font-medium tracking-wide',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
