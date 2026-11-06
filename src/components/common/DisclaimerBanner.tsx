import React from 'react';
import { Database, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DisclaimerBannerProps {
  currentRole?: 'admin' | 'member';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = () => {
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
            <strong className="font-semibold text-tropical-turquoise">Rota de Verão:</strong>{' '}
            {isConfigured ? (
              <span className="text-emerald-300 font-medium">Supabase Conectado com RLS ✅</span>
            ) : (
              <span className="text-tropical-sand-100">Ambiente Seguro dos Participantes.</span>
            )}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 text-[11px] text-tropical-coral hover:text-white transition-colors cursor-pointer bg-white/10 hover:bg-white/15 rounded-full px-3 py-1 border border-white/15"
              title="Encerrar sessão"
            >
              <LogOut className="w-3 h-3" /> Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
