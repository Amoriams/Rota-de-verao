import React from 'react';

/**
 * PageShell — invólucro de layout para todas as páginas internas.
 * Aplica o padding consistente e a largura máxima, levando em conta
 * o deslocamento da sidebar lateral (já aplicado pelo App.tsx).
 */
interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
};

