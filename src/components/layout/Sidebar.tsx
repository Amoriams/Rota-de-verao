import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
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
} from 'lucide-react';

// Itens de navegação com rotas e ícones
const navItems = [
  { label: 'Início',       to: '/',             icon: Home },
  { label: 'Viagem',       to: '/dashboard',    icon: Map },
  { label: 'Passagens',    to: '/passagens',    icon: PlaneTakeoff },
  { label: 'Hospedagem',   to: '/hospedagem',   icon: Building2 },
  { label: 'Carros',       to: '/veiculos',     icon: Car },
  { label: 'Participantes',to: '/participantes',icon: Users },
  { label: 'Votações',     to: '/enquetes',     icon: Vote },
  { label: 'Despesas',     to: '/financeiro',   icon: Receipt },
  { label: 'Configurações',to: '/administracao',icon: Settings },
];

interface SidebarProps {
  currentRole: 'admin' | 'member';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-cyan-100">
        <div className="flex items-center gap-2.5">
          {/* Ícone de palmeira como logotipo simplificado */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-sm">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-tight text-slate-800">Rota de</div>
            <div className="font-display font-bold text-sm leading-tight text-cyan-500">Verão</div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => {
          // "Configurações" só aparece para admin
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
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-500'
                }`}
              />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar — onda e frase */}
      <div className="px-4 pb-5 pt-3 border-t border-cyan-100">
        {/* Onda decorativa SVG */}
        <div className="flex justify-center mb-2 opacity-60">
          <svg viewBox="0 0 120 30" className="w-24 h-6 text-cyan-300" fill="currentColor">
            <path d="M0,15 C10,5 20,25 30,15 C40,5 50,25 60,15 C70,5 80,25 90,15 C100,5 110,25 120,15 L120,30 L0,30 Z" />
          </svg>
        </div>
        <p className="text-center font-display italic text-xs text-cyan-500 font-medium">
          Boa viagem! 🌊
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão hamburguer — mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:bg-cyan-50 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar desktop (fixo) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 shadow-sm z-30">
        <SidebarContent />
      </aside>
    </>
  );
};

