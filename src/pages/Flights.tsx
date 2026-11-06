import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plane, 
  Luggage, 
  Clock, 
  ExternalLink, 
  TrendingDown, 
  Calendar,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { flightService } from '../services/flightService';
import { Flight, CatalogOptionStatus } from '../@types/database.types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';
import { FlightFormModal } from '../components/flights/FlightFormModal';

const STATUS_CONFIG: Record<CatalogOptionStatus, { label: string; bg: string; text: string; border: string }> = {
  in_analysis: {
    label: 'Em análise',
    bg: 'bg-tropical-sand-100',
    text: 'text-tropical-text-secondary',
    border: 'border-tropical-sand-border',
  },
  favorite: {
    label: 'Favorita ⭐',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  chosen: {
    label: 'Escolhida da Turma ✓',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  booked: {
    label: 'Reservada / Emitida ✈️',
    bg: 'bg-tropical-turquoise/15',
    text: 'text-tropical-ocean',
    border: 'border-tropical-turquoise/40',
  },
  discarded: {
    label: 'Descartada',
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

export const Flights: React.FC = () => {
  const { role } = useAuth();
  const { currentTrip } = useTrip();
  const isAdmin = role === 'admin';

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [flightType, setFlightType] = useState<'todos' | 'ida' | 'volta'>('todos');
  const [_statusFilter, _setStatusFilter] = useState<string>('todos');

  // Modais e ações
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flightToEdit, setFlightToEdit] = useState<Flight | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFlights = useCallback(async () => {
    if (!currentTrip?.id) {
      setFlights([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await flightService.getFlights(currentTrip.id);
      setFlights(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar opções de passagens.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const handleOpenCreate = () => {
    setFlightToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flight: Flight) => {
    setFlightToEdit(flight);
    setIsModalOpen(true);
  };

  const handleDelete = async (flight: Flight) => {
    if (!currentTrip) return;
    const confirm = window.confirm(`Deseja realmente excluir a opção de voo da ${flight.airline} (${flight.flight_number || 'Sem número'})?`);
    if (!confirm) return;

    setDeletingId(flight.id);
    try {
      await flightService.deleteFlight(flight.id);
      await loadFlights();
    } catch (err: any) {
      alert(`Erro ao excluir voo: ${err?.message || 'Falha na exclusão'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtragem
  const filteredFlights = flights.filter(f => {
    if (flightType !== 'todos' && f.type !== flightType) return false;
    if (_statusFilter !== 'todos' && (f.status || 'in_analysis') !== _statusFilter) return false;
    return true;
  });

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA COM FILTROS & AÇÃO ADMIN ──────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Plane className="w-3.5 h-3.5 text-tropical-ocean" />
              Catálogo de Passagens Aéreas
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Passagens & Voos em Grupo
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            {currentTrip 
              ? `Opções de trajetos para ${currentTrip.title} (${currentTrip.destination}) pesquisadas pela administradora.`
              : 'Nenhuma viagem selecionada.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Button
              onClick={handleOpenCreate}
              variant="coral"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Passagem
            </Button>
          )}

          {/* Filtro de Tipo em Pills */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm">
            <button
              onClick={() => setFlightType('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flightType === 'todos'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Todos ({flights.length})
            </button>
            <button
              onClick={() => setFlightType('ida')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flightType === 'ida'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Ida
            </button>
            <button
              onClick={() => setFlightType('volta')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                flightType === 'volta'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Volta
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Transparência de Compra */}
      <aside aria-label="Informações sobre compra e monitoramento de passagens" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-turquoise-50 text-tropical-ocean flex items-center justify-center shrink-0 shadow-xs">
          <TrendingDown className="w-5 h-5 text-tropical-ocean" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Compra individual e direta pelo viajante
          </p>
          <p className="text-tropical-text-muted">
            Cada participante adquire seu próprio bilhete diretamente com a companhia aérea para acumular milhas e escolher assentos.
            A administradora cadastra as melhores alternativas encontradas com link oficial para que todos comprem no mesmo voo.
          </p>
        </div>
      </aside>

      {/* ── ESTADOS DE CARREGAMENTO / ERRO / VAZIO ────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-tropical-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-tropical-ocean" />
          <p className="text-sm font-semibold">Carregando catálogo de passagens...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : flights.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-tropical-sand-border/80 shadow-tropical-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-tropical-sand-100 text-tropical-ocean flex items-center justify-center mx-auto">
            <Plane className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-bold text-lg text-tropical-text">
              Nenhuma passagem aérea cadastrada
            </h3>
            <p className="text-sm text-tropical-text-muted">
              {isAdmin 
                ? 'Cadastre opções de voos de ida e volta para compartilhar com os membros da viagem.' 
                : 'A administradora ainda não cadastrou opções de voo para esta viagem.'}
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
        /* ── GRID DE PASSAGENS CADASTRADAS ────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFlights.map((flight) => {
            const statusInfo = STATUS_CONFIG[flight.status || 'in_analysis'];
            const connectionsCount = flight.connections_count ?? 0;
            const connectionsLabel = connectionsCount === 0 
              ? 'Voo Direto' 
              : connectionsCount === 1 
              ? '1 conexão' 
              : `${connectionsCount} conexões`;

            return (
              <div 
                key={flight.id} 
                className={`tropical-card p-6 space-y-5 border-l-4 flex flex-col justify-between ${
                  flight.status === 'chosen' 
                    ? 'border-l-emerald-500 shadow-md ring-1 ring-emerald-500/20' 
                    : flight.status === 'favorite'
                    ? 'border-l-amber-500'
                    : flight.status === 'booked'
                    ? 'border-l-tropical-ocean'
                    : flight.status === 'discarded'
                    ? 'border-l-gray-300 opacity-70 bg-gray-50/50'
                    : 'border-l-tropical-turquoise'
                }`}
              >
                <div className="space-y-4">
                  {/* Topo do Card com Status & Cia Aérea */}
                  <div className="flex items-center justify-between border-b border-tropical-sand-border/30 pb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-tropical-sand-100 text-tropical-ocean flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {flight.airline.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-tropical-text truncate">
                          {flight.airline}
                        </h3>
                        <span className="text-[11px] text-tropical-text-muted font-mono block">
                          {flight.flight_number ? `Voo ${flight.flight_number}` : 'Voo não informado'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        {statusInfo.label}
                      </span>
                      <Badge variant={flight.type === 'ida' ? 'ocean' : 'coral'} size="sm">
                        {flight.type === 'ida' ? 'Ida' : 'Volta'}
                      </Badge>
                    </div>
                  </div>

                  {/* Trajeto e Horários */}
                  <div className="flex items-center justify-between py-2">
                    {/* Origem */}
                    <div className="text-left min-w-[70px]">
                      <div className="text-2xl md:text-3xl font-extrabold font-display text-tropical-ocean tracking-tight">
                        {flight.origin_airport}
                      </div>
                      <div className="text-xs text-tropical-text-muted truncate max-w-[90px]">
                        {flight.origin_city || 'Origem'}
                      </div>
                      <div className="text-xs font-bold text-tropical-text mt-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />
                        {flight.departure_time?.includes(' ') 
                          ? flight.departure_time.split(' ')[1] 
                          : flight.departure_time || '—'}
                      </div>
                    </div>

                    {/* Ícone de Rota & Conexões */}
                    <div className="flex-1 px-3 flex flex-col items-center">
                      <span className="text-[10px] text-tropical-text-muted font-semibold tracking-wide">
                        {connectionsLabel}
                      </span>
                      <div className="w-full flex items-center gap-1 my-1.5">
                        <div className="h-0.5 flex-1 bg-tropical-sand-border/80" />
                        <Plane className="w-4 h-4 text-tropical-turquoise rotate-90" />
                        <div className="h-0.5 flex-1 bg-tropical-sand-border/80" />
                      </div>
                      <span className="text-[10px] text-tropical-palm font-bold uppercase tracking-wider">
                        {connectionsCount === 0 ? 'Sem escalas' : `${connectionsCount} parada(s)`}
                      </span>
                    </div>

                    {/* Destino */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-2xl md:text-3xl font-extrabold font-display text-tropical-ocean tracking-tight">
                        {flight.destination_airport}
                      </div>
                      <div className="text-xs text-tropical-text-muted truncate max-w-[90px]">
                        {flight.destination_city || 'Destino'}
                      </div>
                      <div className="text-xs font-bold text-tropical-text mt-1.5 flex items-center justify-end gap-1">
                        <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />
                        {flight.arrival_time?.includes(' ') 
                          ? flight.arrival_time.split(' ')[1] 
                          : flight.arrival_time || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Informações de Bagagem e Data */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-tropical-sand-border/30 text-xs">
                    <div className="flex items-center gap-1.5 text-tropical-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-tropical-ocean" />
                      <span>Data: <strong>{flight.departure_time?.includes(' ') ? flight.departure_time.split(' ')[0] : flight.departure_time || 'A definir'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Luggage className="w-3.5 h-3.5 text-tropical-text-muted" />
                      {flight.baggage_included ? (
                        <span className="text-tropical-palm font-bold">Mala despachada inclusa (23kg)</span>
                      ) : (
                        <span className="text-tropical-coral font-bold">Mala de mão inclusa (10kg)</span>
                      )}
                    </div>
                  </div>

                  {/* Observações da Administradora */}
                  {flight.notes && (
                    <div className="p-3 rounded-xl bg-tropical-sand-50 border border-tropical-sand-border/50 text-xs text-tropical-text-secondary leading-relaxed">
                      <span className="font-bold text-tropical-text-primary block mb-0.5">Observações da Organizadora:</span>
                      {flight.notes}
                    </div>
                  )}
                </div>

                {/* Preço, Data de Atualização e Ações */}
                <div className="pt-4 border-t border-tropical-sand-border/30 space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-tropical-text-muted uppercase block font-bold">
                        Preço por pessoa
                      </span>
                      <span className="text-2xl font-extrabold font-display text-tropical-text">
                        R$ {Number(flight.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {flight.price_updated_at && (
                        <span className="text-[10px] text-tropical-text-muted block mt-0.5">
                          Preço verificado em {formatPriceDate(flight.price_updated_at)}
                        </span>
                      )}
                    </div>

                    {flight.purchase_url && (
                      <a
                        href={flight.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="coral" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Acessar Oferta
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Ações da Administradora (Editar / Excluir) */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-tropical-sand-border/20">
                      <button
                        onClick={() => handleOpenEdit(flight)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-tropical-ocean hover:text-tropical-ocean-dark px-2.5 py-1 rounded-lg hover:bg-tropical-sand-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Opção
                      </button>
                      <button
                        onClick={() => handleDelete(flight)}
                        disabled={deletingId === flight.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-tropical-coral hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === flight.id ? (
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

      {/* Caixa Informativa sobre Próximos Passos */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-tropical-turquoise" />
            <h3 className="font-display font-bold text-lg text-tropical-text">
              Como funciona a escolha de voos no Rota de Verão
            </h3>
          </div>
          <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean font-bold">
            Transparência & Liberdade
          </span>
        </div>

        <p className="text-xs md:text-sm text-tropical-text-secondary leading-relaxed max-w-3xl">
          A administradora pesquisa e cadastra as melhores rotas e tarifas encontradas. Quando o grupo alinha o voo favorito ou escolhido, cada pessoa ou casal clica em <strong>"Acessar Oferta"</strong> para comprar diretamente na companhia aérea com suas próprias milhas, cartões e preferências de bagagem.
        </p>
      </div>

      {/* ── MODAL DE CADASTRO / EDIÇÃO ────────────────────────────────────── */}
      {currentTrip && (
        <FlightFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tripId={currentTrip.id}
          flightToEdit={flightToEdit}
          onSaved={loadFlights}
          saveFlight={(payload) => flightService.createFlight(payload)}
          updateFlight={(id, payload) => flightService.updateFlight(id, payload)}
        />
      )}

    </PageShell>
  );
};
