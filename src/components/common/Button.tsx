import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'coral' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 shadow-sm',
    md: 'text-sm px-4 py-2.5 gap-2 shadow-sm',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow',
  };

  const variantStyles = {
    primary: 'bg-coastal-ocean text-white hover:bg-coastal-ocean-600 focus:ring-coastal-ocean-500 shadow-coastal',
    secondary: 'bg-coastal-water-light text-coastal-ocean-800 hover:bg-coastal-water focus:ring-coastal-water',
    coral: 'bg-coastal-coral text-white hover:bg-coastal-coral-dark focus:ring-coastal-coral-dark shadow-coastal',
    outline: 'border border-coastal-sand-dark text-coastal-ocean-700 bg-white hover:bg-coastal-sand-light focus:ring-coastal-ocean',
    ghost: 'text-coastal-ocean-700 hover:bg-coastal-sand-light/60 focus:ring-coastal-ocean shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </button>
  );
};

