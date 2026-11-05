import React from 'react';
import { Info, ShieldAlert, Sparkles } from 'lucide-react';

interface DisclaimerBannerProps {
  currentRole: 'admin' | 'member';
  onToggleRole: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  currentRole,
  onToggleRole,
}) => {
  return (
    <aside aria-label="Informações do ambiente de demonstração" className="bg-gradient-to-r from-coastal-ocean-700 via-coastal-ocean to-coastal-ocean-600 text-white text-xs md:text-sm py-2.5 px-4 shadow-sm border-b border-coastal-ocean-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-coastal-water animate-pulse" />
          <Info className="w-4 h-4 text-coastal-water shrink-0 hidden sm:inline" />
          <span>
            <strong className="font-semibold text-coastal-water-light">Marco 2 — Fundação & Interface:</strong>{' '}
            Navegação interativa com <span className="underline decoration-coastal-water/60">dados fictícios identificados</span>. O banco de dados e a autenticação serão conectados nos Marcos 3 e 4.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-coastal-sand-light text-xs hidden lg:inline">
            Visualizando como:
          </span>
          <button
            onClick={onToggleRole}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-medium border border-white/20"
            title="Clique para alternar e testar a perspectiva da interface"
          >
            {currentRole === 'admin' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-coastal-coral" />
                <span>Perfil: <strong>Administradora (Mariana)</strong></span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-coastal-water" />
                <span>Perfil: <strong>Convidada (Carol)</strong></span>
              </>
            )}
            <span className="text-[10px] text-coastal-water-light ml-1 underline">
              (Alternar)
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

