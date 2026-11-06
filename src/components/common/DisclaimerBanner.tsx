import React from 'react';
import { Database, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface DisclaimerBannerProps {
  currentRole?: 'admin' | 'member';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = () => {
  const { isConfigured, user, profile, logout } = useAuth();

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

        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 border border-white/15">
              <Link to="/perfil" className="flex items-center gap-1.5 text-xs text-tropical-sand-100 hover:text-white transition-colors">
                <User className="w-3.5 h-3.5 text-tropical-turquoise" />
                <span className="font-medium truncate max-w-[140px]">
                  {profile?.full_name || user.email || 'Meu Perfil'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 text-[11px] text-tropical-coral hover:text-white transition-colors cursor-pointer ml-1 pl-2 border-l border-white/20"
                title="Encerrar sessão"
              >
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/perfil"
                className="inline-flex items-center gap-1 text-xs text-tropical-sand-100 hover:text-white transition-colors"
              >
                <User className="w-3.5 h-3.5 text-tropical-turquoise" />
                <span>Meu Perfil</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
