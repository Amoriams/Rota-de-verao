import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  PlaneTakeoff,
  Building2,
  Car,
  Users,
  Vote,
  Receipt,
  Settings,
  Menu,
  X,
  Palmtree,
  Sun,
  Compass,
} from 'lucide-react';

const navItems = [
  { label: 'Início',        to: '/',              icon: Home },
  { label: 'Viagem',        to: '/dashboard',     icon: Compass },
  { label: 'Passagens',     to: '/passagens',     icon: PlaneTakeoff },
  { label: 'Hospedagem',    to: '/hospedagem',    icon: Building2 },
  { label: 'Carros',        to: '/veiculos',      icon: Car },
  { label: 'Participantes', to: '/participantes', icon: Users },
  { label: 'Votações',      to: '/enquetes',      icon: Vote },
  { label: 'Despesas',      to: '/financeiro',    icon: Receipt },
  { label: 'Configurações', to: '/administracao', icon: Settings },
];

interface SidebarProps {
  currentRole: 'admin' | 'member';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="px-6 pt-7 pb-6 border-b border-tropical-sand-border/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-tropical-ocean to-tropical-turquoise flex items-center justify-center shadow-tropical-sm text-white relative overflow-hidden group">
            <Palmtree className="w-5 h-5 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
            <Sun className="w-3.5 h-3.5 text-tropical-sand-200 absolute -top-1 -right-1 opacity-80" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight text-tropical-text flex items-center gap-1">
              Rota de <span className="text-tropical-ocean">Verão</span>
            </span>
            <span className="block text-[11px] font-medium text-tropical-text-muted uppercase tracking-wider">
              Viagem em Grupo
            </span>
          </div>
        </div>

        {/* Destino Badge */}
        <div className="mt-4 px-3 py-1.5 rounded-xl bg-tropical-sand-50 border border-tropical-sand-border/50 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-tropical-text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tropical-coral animate-pulse" />
            Fortaleza &bull; Ceará
          </span>
          <span className="text-[10px] font-medium text-tropical-palm font-mono bg-tropical-palm-50 px-2 py-0.5 rounded-full">
            Jan/2027
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => {
          if (label === 'Configurações' && currentRole !== 'admin') return null;

          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`
                group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                    : 'text-tropical-text-secondary hover:text-tropical-ocean hover:bg-tropical-sand-50/70'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-tropical-turquoise' : 'text-tropical-text-muted group-hover:text-tropical-ocean'
                }`}
              />
              <span className="truncate">{label}</span>

              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tropical-coral" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer da Sidebar com clima tropical */}
      <div className="p-4 border-t border-tropical-sand-border/30 bg-tropical-sand-50/40">
        <div className="p-3 rounded-xl bg-white border border-tropical-sand-border/40 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tropical-coral-50 flex items-center justify-center text-tropical-coral">
            <Sun className="w-4 h-4 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-tropical-text truncate">Verão 2027</p>
            <p className="text-[11px] text-tropical-text-muted truncate">Sol, mar & bons amigos</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão Hambúrguer Mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-tropical-sm border border-tropical-sand-border/50 flex items-center justify-center text-tropical-text hover:bg-tropical-sand-50 transition-colors cursor-pointer"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="w-5 h-5 text-tropical-ocean" />
      </button>

      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-tropical-text/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer Mobile */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-tropical-lg
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-tropical-text-muted hover:bg-tropical-sand-100 transition-colors cursor-pointer"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop Fixa */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-tropical-sand-border/40 shadow-tropical-sm z-30">
        <SidebarContent />
      </aside>
    </>
  );
};
