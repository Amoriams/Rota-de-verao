import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  Info,
  Car,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, VehicleWithInterests, CatalogOptionStatus } from '../@types/database.types';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';
import { VehicleFormModal } from '../components/vehicles/VehicleFormModal';

const STATUS_CONFIG: Record<CatalogOptionStatus, { label: string; bg: string; text: string; border: string }> = {
  in_analysis: {
    label: 'Em análise',
    bg: 'bg-tropical-sand-100',
    text: 'text-tropical-text-secondary',
    border: 'border-tropical-sand-border',
  },
  favorite: {
    label: 'Favorito ⭐',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  chosen: {
    label: 'Escolhido da Turma ✓',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  booked: {
    label: 'Reservado 🚗',
    bg: 'bg-tropical-turquoise/15',
    text: 'text-tropical-ocean',
    border: 'border-tropical-turquoise/40',
  },
  discarded: {
    label: 'Descartado',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
};

function formatPriceDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export const Vehicles: React.FC = () => {
  const { role, member, profile } = useAuth();
  const { currentTrip } = useTrip();
  const isAdmin = role === 'admin';

  // ID do usuário para adesão ao veículo
  const currentUserId = member?.id || profile?.id || 'demo-user';

  const [vehicles, setVehicles] = useState<VehicleWithInterests[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modais e ações
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingInterestId, setTogglingInterestId] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!currentTrip?.id) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehicleService.getVehicles(currentTrip.id);
      setVehicles(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar opções de veículos.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleOpenCreate = () => {
    setVehicleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsModalOpen(true);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!currentTrip) return;
    const confirm = window.confirm(`Deseja realmente excluir a opção de veículo "${vehicle.model}" (${vehicle.rental_company})?`);
    if (!confirm) return;

    setDeletingId(vehicle.id);
    try {
      await vehicleService.deleteVehicle(vehicle.id);
      await loadVehicles();
    } catch (err: any) {
      alert(`Erro ao excluir veículo: ${err?.message || 'Falha na exclusão'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleInterest = async (vehicleId: string) => {
    if (!currentTrip?.id) return;
    setTogglingInterestId(vehicleId);
    try {
      // Verificar se o usuário já está interessado neste veículo
      const vehicle = vehicles.find(v => v.id === vehicleId);
      const memberIds = vehicle?.interests?.map((i: any) => i.trip_member_id) ?? [];
      const isCurrentlyInterested = memberIds.includes(currentUserId);
      await vehicleService.toggleInterest(vehicleId, currentUserId, isCurrentlyInterested);
      await loadVehicles();
    } catch (err: any) {
      alert(`Erro ao atualizar interesse: ${err?.message || 'Falha na atualização'}`);
    } finally {
      setTogglingInterestId(null);
    }
  };

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Car className="w-3.5 h-3.5 text-tropical-ocean" />
              Catálogo de Mobilidade & Locação
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Veículos & Aluguel para Translado
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            {currentTrip
              ? `Opções de locação para ${currentTrip.title} (${currentTrip.destination}) cadastradas pela administradora.`
              : 'Nenhuma viagem selecionada.'}
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenCreate}
            variant="coral"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Veículo
          </Button>
        )}
      </div>

      {/* ── ALERTA DA REGRA DE DIVISÃO TRANSPARENTE ─────────────────────────── */}
      <aside aria-label="Informações sobre rateio de veículos" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-palm-50 text-tropical-palm flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-5 h-5 text-tropical-palm" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Regra Fundamental: O custo do veículo é rateado exclusivamente entre quem viaja nele!
          </p>
          <p className="text-tropical-text-muted">
            O valor de cada carro é dividido unicamente entre os ocupantes confirmados no veículo.
            Inscreva-se na opção que melhor atende sua logística e preferências.
          </p>
        </div>
      </aside>

      {/* ── ESTADOS DE CARREGAMENTO / ERRO / VAZIO ────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-tropical-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-tropical-ocean" />
          <p className="text-sm font-semibold">Carregando catálogo de veículos...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-tropical-sand-border/80 shadow-tropical-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-tropical-sand-100 text-tropical-ocean flex items-center justify-center mx-auto">
            <Car className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-bold text-lg text-tropical-text">
              Nenhum veículo cadastrado
            </h3>
            <p className="text-sm text-tropical-text-muted">
              {isAdmin 
                ? 'Cadastre opções de aluguel de carros, vans ou SUVs para organizar os traslados do grupo.' 
                : 'A administradora ainda não cadastrou opções de aluguel de veículo para esta viagem.'}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={handleOpenCreate}
              variant="coral"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Primeira Opção
            </Button>
          )}
        </div>
      ) : (
        /* ── GRID DE VEÍCULOS CADASTRADOS ─────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {vehicles.map((vehicle) => {
            const statusKey: CatalogOptionStatus = (vehicle.status as CatalogOptionStatus) || 'in_analysis';
            const statusInfo = STATUS_CONFIG[statusKey];
            const memberIds: string[] = vehicle.interests?.map((i: any) => i.trip_member_id as string) ?? [];
            const isUserInterested = memberIds.includes(currentUserId);
            const occupiedCount = memberIds.length;
            const passengerCap = vehicle.passenger_capacity || 5;
            const luggageCap = vehicle.luggage_capacity || 2;
            const costPerPerson = occupiedCount > 0 ? vehicle.total_amount / occupiedCount : vehicle.total_amount;
            const isFull = occupiedCount >= passengerCap;
            const occupancyPct = Math.round((occupiedCount / passengerCap) * 100);

            return (
              <div
                key={vehicle.id}
                className={`tropical-card overflow-hidden flex flex-col justify-between group border-t-4 ${
                  vehicle.status === 'chosen'
                    ? 'border-t-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                    : vehicle.status === 'favorite'
                    ? 'border-t-amber-500'
                    : vehicle.status === 'booked'
                    ? 'border-t-tropical-ocean'
                    : vehicle.status === 'discarded'
                    ? 'border-t-gray-300 opacity-70 bg-gray-50/50'
                    : 'border-t-tropical-turquoise'
                }`}
              >
                <div>
                  {/* Imagem do Carro ou Placeholder */}
                  <div className="relative h-56 bg-gradient-to-br from-tropical-sand-100 via-tropical-sand-50 to-white overflow-hidden flex items-center justify-center">
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={vehicle.model}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-tropical-sand-border gap-2">
                        <Car className="w-16 h-16 text-tropical-ocean/40" />
                        <span className="text-xs font-semibold text-tropical-text-muted">Sem foto disponível</span>
                      </div>
                    )}

                    {/* Badges Flutuantes */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="badge-tropical bg-white/95 backdrop-blur-md text-tropical-ocean border border-white/60 shadow-xs">
                        {vehicle.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-tropical-text/85 backdrop-blur-md text-white font-semibold text-xs px-3 py-1 rounded-full shadow-xs">
                      {vehicle.rental_company}
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
                        {vehicle.total_days} diárias &bull; Retirada em {vehicle.pickup_location || 'Local a definir'}
                      </p>
                    </div>

                    {/* Capacidade e Malas */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-tropical-sand-50/60 border border-tropical-sand-border/40 text-xs">
                      <div className="flex items-center gap-2 text-tropical-text font-semibold">
                        <Users className="w-4 h-4 text-tropical-ocean" />
                        <span>{passengerCap} passageiros</span>
                      </div>
                      <div className="flex items-center gap-2 text-tropical-text font-semibold">
                        <Briefcase className="w-4 h-4 text-tropical-palm" />
                        <span>{luggageCap} malas grandes</span>
                      </div>
                    </div>

                    {/* Retirada e Devolução Detalhadas */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-tropical-sand-border/50 text-xs">
                      <div className="flex items-center justify-between text-tropical-text">
                        <span className="flex items-center gap-1.5 text-tropical-text-secondary font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-tropical-ocean" />
                          Retirada:
                        </span>
                        <span>
                          {vehicle.pickup_time || 'A definir'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-tropical-text">
                        <span className="flex items-center gap-1.5 text-tropical-text-secondary font-semibold">
                          <Clock className="w-3.5 h-3.5 text-tropical-coral" />
                          Devolução:
                        </span>
                        <span>
                          {vehicle.return_time || 'A definir'} ({vehicle.return_location || vehicle.pickup_location || 'Mesmo local'})
                        </span>
                      </div>

                      {vehicle.security_deposit ? (
                        <div className="flex items-center justify-between text-tropical-text pt-1 border-t border-tropical-sand-border/30">
                          <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Caução cartão:
                          </span>
                          <span className="font-bold text-amber-900">
                            R$ {Number(vehicle.security_deposit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : null}

                      {vehicle.conditions && (
                        <div className="text-[11px] text-tropical-text-muted pt-1 border-t border-tropical-sand-border/30">
                          <span className="font-semibold text-tropical-text-secondary">Condições: </span>
                          {vehicle.conditions}
                        </div>
                      )}
                    </div>

                    {/* Observações da Organizadora */}
                    {vehicle.notes && (
                      <div className="p-3 rounded-xl bg-tropical-sand-50 border border-tropical-sand-border/50 text-xs text-tropical-text-secondary leading-relaxed">
                        <span className="font-bold text-tropical-text-primary block mb-0.5">Observações:</span>
                        {vehicle.notes}
                      </div>
                    )}

                    {/* Lista de Interessados / Ocupantes */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-tropical-text-muted uppercase tracking-wider">
                          Passageiros Inscritos:
                        </span>
                        <span className="font-bold text-tropical-ocean">
                          {occupiedCount} de {passengerCap} vagas preenchidas ({occupancyPct}%)
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

                      {occupiedCount === 0 ? (
                        <span className="text-xs text-tropical-text-muted italic block">
                          Nenhum passageiro inscrito ainda. Vagas livres!
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {memberIds.map((id: string, idx: number) => (
                            <span 
                              key={id}
                              className="px-2.5 py-0.5 rounded-full bg-white border border-tropical-sand-border/60 text-[11px] font-semibold text-tropical-text shadow-xs"
                            >
                              Passageiro #{idx + 1} {id === currentUserId ? '(Você)' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé com Cálculo de Cota Exclusiva e Botão de Interesse */}
                <div className="p-5 md:p-6 bg-tropical-sand-50/50 border-t border-tropical-sand-border/40 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-tropical-text-muted block">
                        Cota estimada por ocupante
                      </span>
                      <span className="text-2xl font-extrabold font-display text-tropical-ocean">
                        R$ {Number(costPerPerson).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-tropical-text-muted block">
                        (Total R$ {Number(vehicle.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} dividido por {occupiedCount || 1} pessoas)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-tropical-text-muted block">
                        Diária locadora
                      </span>
                      <span className="text-sm font-bold text-tropical-text">
                        R$ {Number(vehicle.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / dia
                      </span>
                      {vehicle.price_updated_at && (
                        <span className="text-[10px] text-tropical-text-muted block mt-0.5">
                          Verificado em {formatPriceDate(vehicle.price_updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleToggleInterest(vehicle.id)}
                      variant={isUserInterested ? 'coral' : 'primary'}
                      size="md"
                      fullWidth
                      disabled={(!isUserInterested && isFull) || togglingInterestId === vehicle.id}
                      icon={togglingInterestId === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    >
                      {isUserInterested 
                        ? 'Sair deste carro' 
                        : isFull 
                        ? 'Carro Lotado' 
                        : 'Quero ir neste carro'}
                    </Button>

                    {vehicle.external_url && (
                      <a
                        href={vehicle.external_url}
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

                  {/* Ações Administrativas (Editar / Excluir) */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-tropical-sand-border/30">
                      <button
                        onClick={() => handleOpenEdit(vehicle)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-tropical-ocean hover:text-tropical-ocean-dark px-2.5 py-1 rounded-lg hover:bg-tropical-sand-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Opção
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle)}
                        disabled={deletingId === vehicle.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-tropical-coral hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === vehicle.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Caixa Informativa sobre Rateio e Adesão */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-tropical-turquoise" />
            <h3 className="font-display font-bold text-lg text-tropical-text">
              Como funciona a organização dos veículos no Rota de Verão
            </h3>
          </div>
          <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean font-bold">
            Divisão Justa
          </span>
        </div>

        <p className="text-xs md:text-sm text-tropical-text-secondary leading-relaxed max-w-3xl">
          A administradora pesquisa veículos com capacidade ideal para o grupo e cadastra com detalhes de caução, horários de voo e seguro. Ao clicar em <strong>"Quero ir neste carro"</strong>, sua vaga é reservada e a cota do veículo é recalculada em tempo real dividindo o valor total apenas entre os ocupantes daquele carro.
        </p>
      </div>

      {/* ── MODAL DE CADASTRO / EDIÇÃO ────────────────────────────────────── */}
      {currentTrip && (
        <VehicleFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tripId={currentTrip.id}
          vehicleToEdit={vehicleToEdit}
          onSaved={loadVehicles}
          saveVehicle={(payload) => vehicleService.createVehicle(payload)}
          updateVehicle={(id, payload) => vehicleService.updateVehicle(id, payload)}
        />
      )}

    </PageShell>
  );
};
