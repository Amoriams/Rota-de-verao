import React from 'react';
import { Palmtree, Plus, Sun, Compass, MapPin } from 'lucide-react';
import { Button } from './Button';

interface EmptyTripStateProps {
  onCreateTrip: () => void;
  isAdmin?: boolean;
}

export const EmptyTripState: React.FC<EmptyTripStateProps> = ({ onCreateTrip, isAdmin = true }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto animate-fade-in">
      {/* Ícone Ilustrativo Tropical Contemporary */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-tropical-ocean to-tropical-turquoise text-white flex items-center justify-center shadow-tropical-lg relative overflow-hidden group">
          <Palmtree className="w-12 h-12 text-white relative z-10" />
          <Sun className="w-6 h-6 text-tropical-sand-200 absolute top-2 right-2 opacity-80" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-tropical-coral text-white flex items-center justify-center shadow-tropical-sm">
          <Compass className="w-4 h-4" />
        </div>
      </div>

      <span className="badge-tropical bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border mb-3">
        Plataforma Multi-Viagens
      </span>

      <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-tropical-text tracking-tight mb-3">
        Bem-vinda ao Rota de Verão!
      </h2>

      <p className="text-tropical-text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
        Você ainda não possui nenhuma viagem ativa cadastrada. Crie uma nova viagem para definir destino, datas e começar a organizar hospedagem, passagens, veículos e enquetes com seus amigos.
      </p>

      {isAdmin ? (
        <Button
          onClick={onCreateTrip}
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5 text-tropical-turquoise" />}
        >
          Criar Minha Primeira Viagem
        </Button>
      ) : (
        <div className="p-4 rounded-2xl bg-tropical-sand-50 border border-tropical-sand-border/50 text-xs text-tropical-text-muted">
          Aguarde a administradora criar a viagem ou enviar o convite de acesso.
        </div>
      )}

      {/* Destaques da plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full text-left pt-8 border-t border-tropical-sand-border/40">
        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
            Qualquer Destino
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Praia, serra ou litoral: defina cidade, estado e datas personalizadas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-tropical-turquoise" />
            Isolamento Total
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Cada viagem tem participantes, enquetes e gastos 100% independentes.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-tropical-sand-border/40 space-y-1">
          <span className="font-bold text-xs text-tropical-text flex items-center gap-1.5">
            <Palmtree className="w-3.5 h-3.5 text-tropical-palm" />
            Multi-Viagens
          </span>
          <p className="text-[11px] text-tropical-text-muted">
            Alterne entre viagens ativas e arquive viagens concluídas quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
};

