import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  onClick,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3.5 md:p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-tropical-sand-border/40 shadow-tropical-sm transition-all duration-300 ${
        hoverable ? 'hover:shadow-tropical hover:border-tropical-turquoise/50 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
