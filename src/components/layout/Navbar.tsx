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
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Participantes', to: '/participantes', icon: <Users className="w-4 h-4" /> },
    { label: 'Hospedagem', to: '/hospedagem', icon: <HomeIcon className="w-4 h-4" /> },
    { label: 'Passagens', to: '/passagens', icon: <Plane className="w-4 h-4" /> },
    { label: 'Veículos', to: '/veiculos', icon: <Car className="w-4 h-4" /> },
    { label: 'Enquetes', to: '/enquetes', icon: <Vote className="w-4 h-4" /> },
    { label: 'Financeiro', to: '/financeiro', icon: <Receipt className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-coastal-sand/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo / Marca */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-coastal-ocean flex items-center justify-center text-white shadow-coastal group-hover:bg-coastal-ocean-600 transition-colors">
              <Palmtree className="w-5 h-5 text-coastal-water-light" />
            </div>
            <div>
              <span className="font-display font-bold text-lg md:text-xl text-coastal-ocean tracking-tight">
                Rota de Verão
              </span>
              <span className="block text-[10px] text-coastal-ocean-600/70 uppercase tracking-widest font-semibold -mt-1">
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
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-coastal-ocean-50 text-coastal-ocean font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-coastal-ocean hover:bg-coastal-sand-light/50'
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
                `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all ml-1 ${
                  isActive
                    ? 'bg-coastal-ocean text-white shadow-coastal'
                    : 'bg-coastal-ocean-50 text-coastal-ocean hover:bg-coastal-ocean-100 border border-coastal-ocean-200'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-coastal-coral" />
              <span>Administração</span>
              {currentRole === 'admin' && (
                <span className="w-2 h-2 rounded-full bg-coastal-coral animate-ping" />
              )}
            </NavLink>
          </nav>

          {/* Botão Mobile Hambúrguer */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/administracao"
              className="p-2 rounded-xl bg-coastal-ocean-50 text-coastal-ocean text-xs font-medium flex items-center gap-1 border border-coastal-ocean-200"
            >
              <ShieldCheck className="w-4 h-4 text-coastal-coral" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-coastal-ocean hover:bg-coastal-sand-light focus:outline-none transition-colors"
              aria-label="Abrir menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-coastal-sand/60 px-4 pt-2 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-1 pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-coastal-ocean-50 text-coastal-ocean font-bold'
                      : 'text-slate-600 hover:bg-coastal-sand-light/50'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-coastal-sand/40">
            <NavLink
              to="/administracao"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-coastal-ocean text-white font-medium text-sm shadow-coastal"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-coastal-coral" />
                Área de Administração
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                Admin
              </span>
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};
