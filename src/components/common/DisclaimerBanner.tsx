import React from 'react';
import { ShieldAlert, Sparkles, Database } from 'lucide-react';
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
    <aside aria-label="Informações do ambiente" className="bg-gradient-to-r from-coastal-ocean-700 via-coastal-ocean to-coastal-ocean-600 text-white text-xs md:text-sm py-2.5 px-4 shadow-sm border-b border-coastal-ocean-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className={`flex h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <Database className="w-4 h-4 text-cyan-300 shrink-0 hidden sm:inline" />
          <span>
            <strong className="font-semibold text-cyan-200">Marco 3 — Banco & Autenticação:</strong>{' '}
            {isConfigured ? (
              <span className="text-emerald-300 font-medium">Supabase Conectado com RLS ✅</span>
            ) : (
              <span>Pronto para conectar ao Supabase (executando em modo demonstrativo seguro).</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-200">
                {user.email || 'Convidado autenticado'}
              </span>
              <button
                onClick={logout}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-medium border border-white/20 transition-all"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <span className="text-cyan-100 text-xs hidden lg:inline">
                Testando como:
              </span>
              <button
                onClick={onToggleRole}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-medium border border-white/20"
                title="Clique para alternar a perspectiva da interface"
              >
                {currentRole === 'admin' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-coastal-coral" />
                    <span>Perfil: <strong>Administradora</strong></span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Perfil: <strong>Convidada</strong></span>
                  </>
                )}
                <span className="text-[10px] text-cyan-200 ml-1 underline">
                  (Alternar)
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
