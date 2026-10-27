import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'gold' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  variant = 'glass',
}) => {
  const variantStyles = {
    default: 'bg-slate-900/90 border border-slate-800 shadow-xl',
    gold: 'bg-slate-900/95 border border-amber-500/30 gold-card-glow',
    glass: 'bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 shadow-2xl',
  }[variant];

  return (
    <div className={`rounded-2xl ${variantStyles} p-5 transition-all ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div>
            {title && (
              <h3 className="font-semibold text-slate-100 tracking-wide font-cinzel text-base flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
