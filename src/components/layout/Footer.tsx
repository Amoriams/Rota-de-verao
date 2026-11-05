import React from 'react';
import { Palmtree, Heart, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-coastal-ocean text-white mt-20 border-t border-coastal-ocean-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Coluna 1: Marca & Filosofia */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-coastal-ocean-600 flex items-center justify-center text-coastal-water-light border border-coastal-ocean-500">
                <Palmtree className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Rota de Verão
              </span>
            </div>
            <p className="text-coastal-ocean-100 text-sm max-w-md leading-relaxed">
              Plataforma privada, elegante e transparente para organização de viagens em grupo.
              Substituindo o caos de mensagens dispersas por decisões democráticas e clareza financeira.
            </p>
            <div className="flex items-center gap-4 text-xs text-coastal-water-light">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-coastal-coral" /> Segurança por RLS
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-coastal-water" /> Custo R$ 0,00
              </span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div>
            <h4 className="font-display font-semibold text-sm text-coastal-sand uppercase tracking-wider mb-3">
              Módulos Principais
            </h4>
            <ul className="space-y-2 text-sm text-coastal-ocean-100">
              <li><Link to="/dashboard" className="hover:text-coastal-water transition-colors">Dashboard da Viagem</Link></li>
              <li><Link to="/participantes" className="hover:text-coastal-water transition-colors">Participantes & Casais</Link></li>
              <li><Link to="/hospedagem" className="hover:text-coastal-water transition-colors">Opções de Hospedagem</Link></li>
              <li><Link to="/passagens" className="hover:text-coastal-water transition-colors">Voos e Trajetos</Link></li>
              <li><Link to="/veiculos" className="hover:text-coastal-water transition-colors">Veículos e Aluguel</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Decisões e Gestão */}
          <div>
            <h4 className="font-display font-semibold text-sm text-coastal-sand uppercase tracking-wider mb-3">
              Transparência
            </h4>
            <ul className="space-y-2 text-sm text-coastal-ocean-100">
              <li><Link to="/enquetes" className="hover:text-coastal-water transition-colors">Votações Democráticas</Link></li>
              <li><Link to="/financeiro" className="hover:text-coastal-water transition-colors">Extrato & Divisão de Custos</Link></li>
              <li><Link to="/administracao" className="hover:text-coastal-water transition-colors">Área Administrativa</Link></li>
              <li><span className="text-coastal-ocean-200/60 text-xs">Versão 0.2.0 (Marco 2)</span></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-coastal-ocean-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-coastal-ocean-200">
          <p>
            &copy; {new Date().getFullYear()} Rota de Verão. Desenvolvido com carinho para momentos inesquecíveis.
          </p>
          <div className="flex items-center gap-1">
            <span>Feito com simplicidade, rigor e</span>
            <Heart className="w-3.5 h-3.5 text-coastal-coral fill-coastal-coral inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};

