import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyle =
    'px-4 py-2.5 text-sm font-semibold rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-navy)] focus-visible:ring-offset-2 transition-colors duration-200';

  const variants = {
    primary:
      'text-white border bg-[var(--app-navy)] border-[var(--app-navy)] hover:bg-[var(--app-navy-hover)] hover:border-[var(--app-navy-hover)] disabled:opacity-50 disabled:pointer-events-none',
    secondary:
      'bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200 disabled:opacity-50',
    danger:
      'bg-red-800 text-white hover:bg-red-900 border border-red-800 disabled:opacity-50',
    outline:
      'bg-white border border-stone-300 text-stone-900 hover:bg-stone-50 hover:border-stone-400',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};
