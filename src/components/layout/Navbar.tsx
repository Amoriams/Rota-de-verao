import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Palmtree, 
  LayoutDashboard, 
  Users, 
  Home as HomeIcon, 
  Plane, 
  Car, 
  Vote, 
  Receipt, 
  ShieldCheck, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

interface NavbarProps {
  currentRole: 'admin' | 'member';
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Início', to: '/', icon: <Compass className="w-4 h-4" /> },
    { label: 'Viagem', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Participantes', to: '/participantes', icon: <Users className="w-4 h-4" /> },
    { label: 'Hospedagem', to: '/hospedagem', icon: <HomeIcon className="w-4 h-4" /> },
    { label: 'Passagens', to: '/passagens', icon: <Plane className="w-4 h-4" /> },
    { label: 'Veículos', to: '/veiculos', icon: <Car className="w-4 h-4" /> },
    { label: 'Enquetes', to: '/enquetes', icon: <Vote className="w-4 h-4" /> },
    { label: 'Financeiro', to: '/financeiro', icon: <Receipt className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-tropical-sand-border/50 shadow-tropical-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo / Marca */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-tropical-ocean to-tropical-turquoise flex items-center justify-center text-white shadow-tropical-sm group-hover:scale-105 transition-transform">
              <Palmtree className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg md:text-xl text-tropical-text tracking-tight">
                Rota de <span className="text-tropical-ocean">Verão</span>
              </span>
              <span className="block text-[10px] text-tropical-text-muted uppercase tracking-widest font-semibold -mt-0.5">
                Fortaleza &bull; 2027
              </span>
            </div>
          </Link>

          {/* Links Desktop */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                      : 'text-tropical-text-secondary hover:text-tropical-ocean hover:bg-tropical-sand-50'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Link para Administração */}
            <NavLink
              to="/administracao"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ml-1 ${
                  isActive
                    ? 'bg-tropical-coral text-white shadow-tropical-sm'
                    : 'bg-tropical-coral-50 text-tropical-coral hover:bg-tropical-coral-100 border border-tropical-coral-200'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-tropical-coral" />
              <span>Administração</span>
              {currentRole === 'admin' && (
                <span className="w-2 h-2 rounded-full bg-tropical-coral animate-ping" />
              )}
            </NavLink>
          </nav>

          {/* Botão Mobile Hambúrguer */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/administracao"
              className="p-2 rounded-xl bg-tropical-sand-50 text-tropical-ocean text-xs font-medium flex items-center gap-1 border border-tropical-sand-border"
            >
              <ShieldCheck className="w-4 h-4 text-tropical-coral" />
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-tropical-text hover:bg-tropical-sand-50 focus:outline-none"
              aria-label="Menu principal"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile Retrátil */}
      {isOpen && (
        <div className="lg:hidden border-t border-tropical-sand-border/40 bg-white px-4 pt-2 pb-6 space-y-1 shadow-tropical-lg">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                    : 'text-tropical-text-secondary hover:bg-tropical-sand-50 hover:text-tropical-ocean'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <NavLink
            to="/administracao"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-tropical-coral text-white'
                  : 'bg-tropical-coral-50 text-tropical-coral'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Painel da Administradora</span>
          </NavLink>
        </div>
      )}
    </header>
  );
};
