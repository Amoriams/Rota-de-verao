import React from 'react';
import { Palmtree, Plus, Sun, Compass, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from './Button';

interface EmptyTripStateProps {
  onCreateTrip: () => void;
  isAdmin?: boolean;
}

export const EmptyTripState: React.FC<EmptyTripStateProps> = ({ onCreateTrip }) => {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto animate-fade-in">
      {/* Ícone Ilustrativo Tropical Contemporary */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-tropical-ocean to-tropical-turquoise text-white flex items-center justify-center shadow-tropical-lg relative overflow-hidden group">
          <Palmtree className="w-12 h-12 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
          <Sun className="w-6 h-6 text-tropical-sand-200 absolute top-2 right-2 opacity-80" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-tropical-coral text-white flex items-center justify-center shadow-tropical-sm">
          <Compass className="w-4 h-4" />
        </div>
      </div>

      <span className="badge-tropical bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border mb-3">
        Plataforma de Viagens em Grupo
      </span>

      <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-tropical-text tracking-tight mb-3">
        Sua próxima viagem começa aqui.
      </h1>

      <p className="text-tropical-text-muted text-sm sm:text-base leading-relaxed mb-4 max-w-lg">
        O Rota de Verão é a plataforma para planejar viagens inesquecíveis em grupo: vote nas melhores hospedagens, alinhe voos, organize caronas e divida custos com total transparência.
      </p>

      <p className="text-xs font-semibold text-tropical-text-secondary bg-tropical-sand-50 border border-tropical-sand-border/60 rounded-full px-4 py-1.5 mb-8">
        Você ainda não possui viagens cadastradas.
      </p>

      <Button
        onClick={onCreateTrip}
        variant="coral"
        size="lg"
        icon={<Plus className="w-5 h-5" />}
        className="shadow-tropical hover:scale-105 transition-transform"
      >
        Criar nova viagem
      </Button>

      {/* Destaques da plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full text-left pt-8 border-t border-tropical-sand-border/40">
        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1 shadow-xs">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
            Qualquer Destino
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Praia, serra ou litoral: defina cidade, estado e datas personalizadas para seu grupo.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1 shadow-xs">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-tropical-turquoise" />
            Isolamento Total
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Cada viagem possui participantes, enquetes, carros e gastos 100% independentes.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1 shadow-xs">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-tropical-palm" />
            Multi-Viagens
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Organize suas próprias viagens e participe das viagens de amigos com logins unificados.
          </p>
        </div>
      </div>
    </div>
  );
};
