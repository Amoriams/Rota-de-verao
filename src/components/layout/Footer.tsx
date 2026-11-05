import React from 'react';
import { Palmtree, Heart, Shield, Sparkles, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-tropical-text text-white mt-16 border-t border-tropical-ocean-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Coluna 1: Marca & Filosofia */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-tropical-ocean flex items-center justify-center text-tropical-turquoise shadow-tropical-sm">
                <Palmtree className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Rota de <span className="text-tropical-turquoise">Verão</span>
              </span>
            </div>
            <p className="text-tropical-sand-100/80 text-sm max-w-md leading-relaxed">
              Plataforma contemporânea de planejamento de viagens em grupo.
              Substituindo o caos de planilhas dispersas por decisões colaborativas e transparência total.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-tropical-turquoise/90 pt-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-tropical-coral" /> Segurança RLS
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-tropical-sand-300" /> Custo Zero (R$ 0,00)
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-tropical-turquoise" /> Fortaleza 2027
              </span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div>
            <h4 className="font-display font-semibold text-xs text-tropical-sand-200 uppercase tracking-wider mb-3">
              Módulos da Viagem
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/dashboard" className="hover:text-tropical-turquoise transition-colors">Visão Geral</Link></li>
              <li><Link to="/participantes" className="hover:text-tropical-turquoise transition-colors">Participantes & Casais</Link></li>
              <li><Link to="/hospedagem" className="hover:text-tropical-turquoise transition-colors">Hospedagem</Link></li>
              <li><Link to="/passagens" className="hover:text-tropical-turquoise transition-colors">Passagens Aéreas</Link></li>
              <li><Link to="/veiculos" className="hover:text-tropical-turquoise transition-colors">Veículos e Aluguel</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Transparência */}
          <div>
            <h4 className="font-display font-semibold text-xs text-tropical-sand-200 uppercase tracking-wider mb-3">
              Organização
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/enquetes" className="hover:text-tropical-turquoise transition-colors">Votações Democráticas</Link></li>
              <li><Link to="/financeiro" className="hover:text-tropical-turquoise transition-colors">Divisão de Custos</Link></li>
              <li><Link to="/administracao" className="hover:text-tropical-turquoise transition-colors">Painel Administrativo</Link></li>
              <li className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 text-tropical-sand-100 text-[11px] font-mono">
                  Marco 3 Ativo
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-3">
          <p>
            &copy; {new Date().getFullYear()} Rota de Verão. Feito para reunir os melhores amigos.
          </p>
          <p className="flex items-center gap-1 text-tropical-sand-200/80">
            Viva o verão <Heart className="w-3.5 h-3.5 text-tropical-coral fill-tropical-coral" />
          </p>
        </div>
      </div>
    </footer>
  );
};
