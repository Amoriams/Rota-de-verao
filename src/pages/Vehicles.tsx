import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  Info
} from 'lucide-react';
import { MOCK_VEHICLES, MOCK_PARTICIPANTS } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Vehicle } from '../types';

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
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Veículos & Aluguel para Translado
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Organização dos carros para o trajeto Fortaleza &harr; Cumbuco e passeios nas praias vizinhas.
          </p>
        </div>
      </div>

      {/* Alerta da Regra Rígida de Divisão de Veículos */}
      <aside aria-label="Informações sobre rateio de veículos" className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 md:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-emerald-900 leading-relaxed space-y-1">
          <p className="font-semibold text-emerald-950">
            Regra Rígida de Rateio: O custo do carro é dividido exclusivamente entre seus ocupantes!
          </p>
          <p>
            O sistema <strong>nunca</strong> divide o valor de um carro entre todos os 10 participantes da viagem.
            Se você for andar no Carro 01, o valor é dividido apenas entre as pessoas que estiverem no Carro 01.
          </p>
        </div>
      </aside>

      {/* Grid de Veículos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {vehiclesList.map((vehicle) => {
          const isUserInterested = vehicle.interestedMemberIds.includes(currentUserId);
          const interestedParticipants = MOCK_PARTICIPANTS.filter(p => 
            vehicle.interestedMemberIds.includes(p.id)
          );
          const occupiedCount = vehicle.interestedMemberIds.length;
          const costPerPerson = occupiedCount > 0 ? vehicle.totalAmount / occupiedCount : vehicle.totalAmount;
          const isFull = occupiedCount >= vehicle.passengerCapacity;

          return (
            <Card key={vehicle.id} padding="none" className="overflow-hidden flex flex-col justify-between border-t-4 border-t-coastal-ocean">
              
              <div>
                {/* Imagem do Carro */}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.model}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="ocean" size="sm">
                      {vehicle.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-coastal-ocean font-bold text-xs px-2.5 py-1 rounded-full shadow-xs">
                    Locadora: {vehicle.rentalCompany}
                  </div>
                </div>

                {/* Dados do Carro */}
                <div className="p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-xl text-coastal-ocean">
                      {vehicle.model}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {vehicle.totalDays} diárias &bull; Retirada e devolução no {vehicle.pickupLocation}
                    </p>
                  </div>

                  {/* Capacidade e Malas */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/50 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-coastal-ocean" />
                      <span>Capacidade: <strong>{vehicle.passengerCapacity} passageiros</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Briefcase className="w-4 h-4 text-coastal-ocean" />
                      <span>Porta-malas: <strong>{vehicle.luggageCapacity} malas grandes</strong></span>
                    </div>
                  </div>

                  {/* Lista de Interessados / Ocupantes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 uppercase tracking-wider">
                        Passageiros Confirmados no Carro:
                      </span>
                      <span className="font-bold text-coastal-ocean">
                        {occupiedCount} / {vehicle.passengerCapacity} vagas preenchidas
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {interestedParticipants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-coastal-sand/70 text-xs text-coastal-ocean shadow-xs"
                        >
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-medium">{p.name.split(' ')[0]}</span>
                          {p.id === currentUserId && (
                            <span className="text-[10px] text-coastal-coral font-bold">(Você)</span>
                          )}
                        </div>
                      ))}
                      {occupiedCount === 0 && (
                        <span className="text-xs text-slate-400 italic">
                          Nenhum passageiro inscrito ainda.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé com Cálculo de Cota Exclusiva e Botão de Interesse */}
              <div className="p-5 md:p-6 bg-coastal-offwhite border-t border-coastal-sand/50 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Cota Exclusiva por Passageiro
                    </span>
                    <span className="text-2xl font-bold font-display text-coastal-ocean">
                      R$ {costPerPerson.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      (R$ {vehicle.totalAmount.toFixed(2)} divididos entre os {occupiedCount || 1} ocupantes)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Diária da locadora
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
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

            </Card>
          );
        })}
      </div>

    </div>
  );
};
