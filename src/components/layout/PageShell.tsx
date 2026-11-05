import React from 'react';

/**
 * PageShell — invólucro de layout para todas as páginas internas.
 * Aplica o padding consistente e a largura máxima com estética Tropical Contemporary.
 */
interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
