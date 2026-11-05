import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'ocean' | 'water' | 'sand' | 'coral' | 'palm' | 'success' | 'warning' | 'danger' | 'neutral';
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
    ocean: 'bg-tropical-ocean-50 text-tropical-ocean-700 border border-tropical-ocean-200',
    water: 'bg-tropical-turquoise-50 text-tropical-ocean-800 border border-tropical-turquoise-200',
    sand: 'bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border',
    coral: 'bg-tropical-coral-50 text-tropical-coral-600 border border-tropical-coral-200',
    palm: 'bg-tropical-palm-50 text-tropical-palm-600 border border-tropical-palm-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-slate-100 text-tropical-text-secondary border border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium rounded-full',
    md: 'text-xs md:text-sm px-3 py-1 font-medium rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-block shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
