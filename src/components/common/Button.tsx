import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'coral' | 'palm' | 'outline' | 'ghost';
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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 shadow-xs',
    md: 'text-sm px-4 py-2.5 gap-2 shadow-tropical-sm',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-tropical',
  };

  const variantStyles = {
    primary: 'bg-tropical-ocean text-white hover:bg-tropical-ocean-600 focus:ring-tropical-ocean shadow-tropical-sm hover:shadow-tropical',
    secondary: 'bg-tropical-turquoise-100 text-tropical-ocean-800 hover:bg-tropical-turquoise-200 focus:ring-tropical-turquoise',
    coral: 'bg-tropical-coral text-white hover:bg-tropical-coral-500 focus:ring-tropical-coral shadow-tropical-sm',
    palm: 'bg-tropical-palm text-white hover:bg-tropical-palm-600 focus:ring-tropical-palm shadow-tropical-sm',
    outline: 'border border-tropical-sand-border text-tropical-ocean bg-white hover:bg-tropical-sand-50 focus:ring-tropical-ocean',
    ghost: 'text-tropical-text-secondary hover:bg-tropical-sand-50 hover:text-tropical-ocean focus:ring-tropical-ocean shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
