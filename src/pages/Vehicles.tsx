import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  Info,
  Car,
  MapPin
} from 'lucide-react';
import { MOCK_VEHICLES, MOCK_PARTICIPANTS } from '../data/mockData';
import { Button } from '../components/common/Button';
import { Vehicle } from '../types';
import { PageShell } from '../components/layout/PageShell';

export const Vehicles: React.FC = () => {
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>(MOCK_VEHICLES);
  const currentUserId = 'p-3'; // Simulação: Carol logada

  // Função para simular marcar ou desmarcar interesse no veículo
  const handleToggleInterest = (vehicleId: string) => {
    setVehiclesList(prev => prev.map(veh => {
      if (veh.id !== vehicleId) return veh;
      const isInterested = veh.interestedMemberIds.includes(currentUserId);
      const updatedInterested = isInterested
        ? veh.interestedMemberIds.filter(id => id !== currentUserId)
        : [...veh.interestedMemberIds, currentUserId];
      return { ...veh, interestedMemberIds: updatedInterested };
    }));
  };

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Car className="w-3.5 h-3.5 text-tropical-ocean" />
              Mobilidade & Translados
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Veículos & Aluguel para Translado
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Organização dos carros para o trajeto Fortaleza &harr; Cumbuco e passeios nas praias vizinhas.
          </p>
        </div>
      </div>

      {/* ── ALERTA DA REGRA RÍGIDA DE DIVISÃO ──────────────────────────────── */}
      <aside aria-label="Informações sobre rateio de veículos" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-palm-50 text-tropical-palm flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-5 h-5 text-tropical-palm" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Regra Fundamental: O custo do veículo é rateado exclusivamente entre quem viaja nele!
          </p>
          <p className="text-tropical-text-muted">
            O valor de cada carro <strong>nunca</strong> é dividido indistintamente entre todos os 10 membros da viagem.
            Se você estiver no Carro 01, seu valor é rateado unicamente entre os ocupantes do Carro 01. Transparência justa e exata!
          </p>
        </div>
      </aside>

      {/* ── GRID DE VEÍCULOS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {vehiclesList.map((vehicle) => {
          const isUserInterested = vehicle.interestedMemberIds.includes(currentUserId);
          const interestedParticipants = MOCK_PARTICIPANTS.filter(p => 
            vehicle.interestedMemberIds.includes(p.id)
          );
          const occupiedCount = vehicle.interestedMemberIds.length;
          const costPerPerson = occupiedCount > 0 ? vehicle.totalAmount / occupiedCount : vehicle.totalAmount;
          const isFull = occupiedCount >= vehicle.passengerCapacity;
          const occupancyPct = Math.round((occupiedCount / vehicle.passengerCapacity) * 100);

          return (
            <div
              key={vehicle.id}
              className="tropical-card overflow-hidden flex flex-col justify-between group border-t-4 border-t-tropical-ocean"
            >
              <div>
                {/* Imagem do Carro */}
                <div className="relative h-60 bg-tropical-sand-100 overflow-hidden">
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.model}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge-tropical bg-white/90 backdrop-blur-md text-tropical-ocean border border-white/50 shadow-xs">
                      {vehicle.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-tropical-text/80 backdrop-blur-md text-white font-semibold text-xs px-3 py-1 rounded-full shadow-xs">
                    Locadora: {vehicle.rentalCompany}
                  </div>
                </div>

                {/* Dados do Carro */}
                <div className="p-5 md:p-6 space-y-5">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-tropical-text">
                      {vehicle.model}
                    </h3>
                    <p className="text-xs text-tropical-text-muted mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-tropical-coral shrink-0" />
                      {vehicle.totalDays} diárias &bull; Retirada e devolução no {vehicle.pickupLocation}
                    </p>
                  </div>

                  {/* Capacidade e Malas */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-tropical-sand-50/60 border border-tropical-sand-border/40 text-xs">
                    <div className="flex items-center gap-2 text-tropical-text font-semibold">
                      <Users className="w-4 h-4 text-tropical-ocean" />
                      <span>{vehicle.passengerCapacity} passageiros</span>
                    </div>
                    <div className="flex items-center gap-2 text-tropical-text font-semibold">
                      <Briefcase className="w-4 h-4 text-tropical-palm" />
                      <span>{vehicle.luggageCapacity} malas grandes</span>
                    </div>
                  </div>

                  {/* Lista de Interessados / Ocupantes */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-tropical-text-muted uppercase tracking-wider">
                        Passageiros Inscritos:
                      </span>
                      <span className="font-bold text-tropical-ocean">
                        {occupiedCount} de {vehicle.passengerCapacity} vagas preenchidas ({occupancyPct}%)
                      </span>
                    </div>

                    {/* Barra de Ocupação */}
                    <div className="w-full bg-tropical-sand-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-tropical-coral' : 'bg-tropical-palm'
                        }`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {interestedParticipants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-tropical-sand-border/60 text-xs text-tropical-text shadow-xs"
                        >
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-semibold">{p.name.split(' ')[0]}</span>
                          {p.id === currentUserId && (
                            <span className="text-[10px] text-tropical-coral font-bold">(Você)</span>
                          )}
                        </div>
                      ))}
                      {occupiedCount === 0 && (
                        <span className="text-xs text-tropical-text-muted italic">
                          Nenhum passageiro inscrito ainda. Vagas livres!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé com Cálculo de Cota Exclusiva e Botão de Interesse */}
              <div className="p-5 md:p-6 bg-tropical-sand-50/50 border-t border-tropical-sand-border/40 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-tropical-text-muted block">
                      Cota por ocupante
                    </span>
                    <span className="text-2xl font-extrabold font-display text-tropical-ocean">
                      R$ {costPerPerson.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-tropical-text-muted block">
                      (R$ {vehicle.totalAmount.toFixed(2)} divididos entre {occupiedCount || 1} pessoas)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-tropical-text-muted block">
                      Diária locadora
                    </span>
                    <span className="text-sm font-bold text-tropical-text">
                      R$ {vehicle.dailyRate.toFixed(2)} / dia
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleToggleInterest(vehicle.id)}
                    variant={isUserInterested ? 'coral' : 'primary'}
                    size="md"
                    fullWidth
                    disabled={!isUserInterested && isFull}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {isUserInterested 
                      ? 'Sair deste carro' 
                      : isFull 
                      ? 'Carro Lotado' 
                      : 'Quero ir neste carro'}
                  </Button>

                  {vehicle.externalUrl && (
                    <a
                      href={vehicle.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="md" icon={<ExternalLink className="w-4 h-4" />}>
                        Locadora
                      </Button>
                    </a>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </PageShell>
  );
};
