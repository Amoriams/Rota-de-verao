import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'ocean' | 'water' | 'sand' | 'coral' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    ocean: 'bg-coastal-ocean-50 text-coastal-ocean-700 border border-coastal-ocean-200',
    water: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
    sand: 'bg-coastal-sand-light text-coastal-sand-dark border border-coastal-sand-border',
    coral: 'bg-orange-50 text-coastal-coral-dark border border-coastal-coral-light',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs md:text-sm px-2.5 py-1 font-medium rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-block">{icon}</span>}
      {children}
    </span>
  );
};

