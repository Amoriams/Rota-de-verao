import React from 'react';
import { ShieldAlert, Sparkles, Database, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DisclaimerBannerProps {
  currentRole: 'admin' | 'member';
  onToggleRole: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  currentRole,
  onToggleRole,
}) => {
  const { isConfigured, user, logout } = useAuth();

  return (
    <aside
      aria-label="Informações do ambiente"
      className="bg-tropical-text text-white text-xs py-2 px-4 shadow-sm border-b border-tropical-ocean-800/40 relative z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-2 w-2 rounded-full ${
              isConfigured ? 'bg-tropical-turquoise animate-pulse' : 'bg-tropical-coral animate-pulse'
            }`}
          />
          <Database className="w-3.5 h-3.5 text-tropical-turquoise shrink-0 hidden sm:inline" />
          <span className="text-white/90">
            <strong className="font-semibold text-tropical-turquoise">Marco 3 Ativo:</strong>{' '}
            {isConfigured ? (
              <span className="text-emerald-300 font-medium">Supabase Conectado com RLS ✅</span>
            ) : (
              <span className="text-tropical-sand-100">Modo Demonstrativo Seguro (Pronto para conexão).</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 border border-white/15">
              <span className="text-xs text-tropical-sand-100 font-medium">
                {user.email || 'Participante'}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 text-[11px] text-tropical-coral hover:text-white transition-colors cursor-pointer"
                title="Encerrar sessão"
              >
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-[11px] hidden lg:inline">
                Perspectiva:
              </span>
              <button
                onClick={onToggleRole}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-semibold border border-white/20 text-white cursor-pointer active:scale-95"
                title="Clique para alternar a perspectiva da interface entre Administradora e Convidada"
              >
                {currentRole === 'admin' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-tropical-coral" />
                    <span>Visão: <span className="text-tropical-coral">Administradora</span></span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-tropical-turquoise" />
                    <span>Visão: <span className="text-tropical-turquoise">Convidada</span></span>
                  </>
                )}
                <span className="text-[10px] text-tropical-sand-200 underline ml-0.5">
                  (alternar)
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
