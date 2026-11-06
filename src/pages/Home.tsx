import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Share2,
  Check,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Loader2,
  Compass,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { Trip } from '../@types/database.types';
import { useTrip } from '../contexts/TripContext';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/common/Button';
import { EmptyTripState } from '../components/common/EmptyTripState';
import { TripFormModal } from '../components/trips/TripFormModal';
import { DeleteTripModal } from '../components/trips/DeleteTripModal';

function formatarData(dataIso: string | null | undefined): string {
  if (!dataIso) return '—';
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  if (!ano || !mes) return dataIso;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ano, mes - 1, dia ?? 1));
}

function formatarPeriodo(trip: Trip): string {
  const inicio = formatarData(trip.start_date);
  const fim = formatarData(trip.end_date);
  if (inicio !== '—' && fim !== '—') return `${inicio} → ${fim}`;
  if (inicio !== '—') return `A partir de ${inicio}`;
  return 'Datas a definir';
}

function formatarLocalizacao(trip: Trip): string {
  const partes = [trip.destination, trip.city, trip.state, trip.country].filter(Boolean);
  return partes.join(', ') || 'Destino a definir';
}

const GRADIENTE_PLACEHOLDER =
  'bg-gradient-to-br from-tropical-ocean via-tropical-turquoise to-tropical-palm';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTrips,
    archivedTrips,
    myCreatedTrips,
    myInvitedTrips,
    currentTrip,
    isLoading,
    selectTrip,
    archiveTrip,
    restoreTrip,
  } = useTrip();

  // Modais de criação, edição e exclusão
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [tripParaEditar, setTripParaEditar] = useState<Trip | null>(null);

  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [tripParaExcluir, setTripParaExcluir] = useState<Trip | null>(null);

  const [secaoArquivadasAberta, setSecaoArquivadasAberta] = useState(false);
  const [arquivandoId, setArquivandoId] = useState<string | null>(null);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abrirCriacao = () => {
    setTripParaEditar(null);
    setModalFormAberto(true);
  };

  const abrirEdicao = (trip: Trip) => {
    setTripParaEditar(trip);
    setModalFormAberto(true);
  };

  const fecharFormModal = () => {
    setModalFormAberto(false);
    setTripParaEditar(null);
  };

  const abrirExclusao = (trip: Trip) => {
    setTripParaExcluir(trip);
    setModalDeleteAberto(true);
  };

  const fecharDeleteModal = () => {
    setModalDeleteAberto(false);
    setTripParaExcluir(null);
  };

  const handleAbrirViagem = (trip: Trip) => {
    selectTrip(trip.id);
    navigate('/dashboard');
  };

  const handleCopyLink = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/convite/${trip.id}`;
    navigator.clipboard?.writeText?.(link);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArquivar = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (arquivandoId) return;
    setArquivandoId(trip.id);
    try {
      await archiveTrip(trip.id);
    } finally {
      setArquivandoId(null);
    }
  };

  const handleRestaurar = async (trip: Trip) => {
    if (restaurandoId) return;
    setRestaurandoId(trip.id);
    try {
      await restoreTrip(trip.id);
    } finally {
      setRestaurandoId(null);
    }
  };

  // ── ESTADO DE CARREGAMENTO ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-tropical-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-tropical-ocean" />
          <p className="text-sm font-semibold">Carregando painel de viagens...</p>
        </div>
      </PageShell>
    );
  }

  // ── ESTADO VAZIO: NENHUMA VIAGEM CADASTRADA ───────────────────────────────
  if (activeTrips.length === 0 && archivedTrips.length === 0) {
    return (
      <PageShell>
        <EmptyTripState onCreateTrip={abrirCriacao} />
        <TripFormModal
          isOpen={modalFormAberto}
          onClose={fecharFormModal}
          trip={tripParaEditar}
        />
      </PageShell>
    );
  }

  // ── PAINEL DE VIAGENS EXISTENTES (ORGANIZADAS POR TIPO) ────────────────────
  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DO PAINEL ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Compass className="w-3.5 h-3.5 text-tropical-ocean" />
              Painel de Viagens
            </span>
            <span className="badge-tropical bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border">
              {activeTrips.length} {activeTrips.length === 1 ? 'viagem ativa' : 'viagens ativas'}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Suas Viagens & Grupos
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Selecione uma viagem para gerenciar os preparativos ou crie um novo roteiro com amigos.
          </p>
        </div>

        {/* Botão sempre disponível para qualquer usuário autenticado criar nova viagem */}
        <Button
          onClick={abrirCriacao}
          variant="coral"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          className="shadow-tropical sm:self-auto self-start"
        >
          Criar nova viagem
        </Button>
      </div>

      {/* ── SEÇÃO 1: VIAGENS QUE VOCÊ ORGANIZA (ADMINISTRADORA) ──────────────── */}
      {myCreatedTrips.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-tropical-text">
              Viagens que você organiza
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tropical-ocean/10 text-tropical-ocean border border-tropical-ocean/20">
              Organizadora
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCreatedTrips.map((trip) => {
              const isSelected = trip.id === currentTrip?.id;

              return (
                <article
                  key={trip.id}
                  className={`tropical-card flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-tropical ${
                    isSelected ? 'ring-2 ring-tropical-ocean shadow-tropical-sm' : ''
                  }`}
                >
                  {/* Capa */}
                  <div className="relative h-40 overflow-hidden shrink-0">
                    {trip.cover_image_url ? (
                      <img
                        src={trip.cover_image_url}
                        alt={`Capa de ${trip.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full ${GRADIENTE_PLACEHOLDER} flex items-center justify-center`}>
                        <ImageIcon className="w-10 h-10 text-white/50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badges Flutuantes */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isSelected && (
                        <span className="badge-tropical bg-tropical-ocean text-white border-0 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Viagem Ativa
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-display font-extrabold text-lg text-white leading-tight drop-shadow-sm truncate">
                        {trip.title}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-white/90 drop-shadow-xs truncate mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-tropical-sand-300 shrink-0" />
                        {formatarLocalizacao(trip)}
                      </p>
                    </div>
                  </div>

                  {/* Detalhes & Período */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-tropical-text-secondary">
                        <CalendarDays className="w-3.5 h-3.5 text-tropical-ocean shrink-0" />
                        <span>{formatarPeriodo(trip)}</span>
                      </div>

                      {trip.description && (
                        <p className="text-xs text-tropical-text-muted line-clamp-2 leading-relaxed">
                          {trip.description}
                        </p>
                      )}
                    </div>

                    {/* Ações da Viagem */}
                    <div className="space-y-2 pt-2 border-t border-tropical-sand-border/30">
                      <div className="flex items-center gap-2">
                        <Button
                          fullWidth
                          size="sm"
                          variant={isSelected ? 'primary' : 'outline'}
                          onClick={() => handleAbrirViagem(trip)}
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          {isSelected ? 'Gerenciar Viagem' : 'Abrir Viagem'}
                        </Button>

                        <button
                          onClick={(e) => handleCopyLink(trip, e)}
                          title="Copiar link de convite"
                          className="p-2 rounded-xl bg-tropical-sand-50 border border-tropical-sand-border/60 text-tropical-ocean hover:bg-tropical-sand-100 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedId === trip.id ? (
                            <Check className="w-4 h-4 text-tropical-palm" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Ações Administrativas */}
                      <div className="flex items-center justify-between text-xs text-tropical-text-muted pt-1">
                        <button
                          onClick={() => abrirEdicao(trip)}
                          className="inline-flex items-center gap-1 hover:text-tropical-ocean transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>

                        <button
                          onClick={(e) => handleArquivar(trip, e)}
                          disabled={arquivandoId === trip.id}
                          className="inline-flex items-center gap-1 hover:text-tropical-ocean transition-colors cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          Arquivar
                        </button>

                        <button
                          onClick={() => abrirExclusao(trip)}
                          className="inline-flex items-center gap-1 text-tropical-coral hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SEÇÃO 2: VIAGENS EM QUE VOCÊ PARTICIPA (CONVIDADA) ────────────────── */}
      {myInvitedTrips.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-tropical-sand-border/30">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-tropical-text">
              Viagens em que você participa
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              Participante Convidada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myInvitedTrips.map((trip) => {
              const isSelected = trip.id === currentTrip?.id;

              return (
                <article
                  key={trip.id}
                  className={`tropical-card flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-tropical ${
                    isSelected ? 'ring-2 ring-tropical-turquoise shadow-tropical-sm' : ''
                  }`}
                >
                  <div className="relative h-40 overflow-hidden shrink-0">
                    {trip.cover_image_url ? (
                      <img
                        src={trip.cover_image_url}
                        alt={`Capa de ${trip.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full ${GRADIENTE_PLACEHOLDER} flex items-center justify-center`}>
                        <ImageIcon className="w-10 h-10 text-white/50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-display font-extrabold text-lg text-white leading-tight drop-shadow-sm truncate">
                        {trip.title}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-white/90 drop-shadow-xs truncate mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-tropical-sand-300 shrink-0" />
                        {formatarLocalizacao(trip)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-tropical-text-secondary">
                        <CalendarDays className="w-3.5 h-3.5 text-tropical-turquoise shrink-0" />
                        <span>{formatarPeriodo(trip)}</span>
                      </div>

                      {trip.description && (
                        <p className="text-xs text-tropical-text-muted line-clamp-2 leading-relaxed">
                          {trip.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-tropical-sand-border/30">
                      <Button
                        fullWidth
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        onClick={() => handleAbrirViagem(trip)}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isSelected ? 'Acessar Viagem' : 'Entrar nesta Viagem'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SEÇÃO 3: VIAGENS ARQUIVADAS (COLAPSÁVEL) ──────────────────────────── */}
      {archivedTrips.length > 0 && (
        <section aria-label="Viagens arquivadas" className="pt-4 border-t border-tropical-sand-border/30">
          <button
            onClick={() => setSecaoArquivadasAberta((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-tropical-text-secondary hover:text-tropical-ocean transition-colors mb-4 cursor-pointer"
            aria-expanded={secaoArquivadasAberta}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                secaoArquivadasAberta ? 'rotate-180' : ''
              }`}
            />
            Viagens Arquivadas ({archivedTrips.length})
          </button>

          {secaoArquivadasAberta && (
            <div className="space-y-3 animate-fade-in">
              {archivedTrips.map((trip) => (
                <article
                  key={trip.id}
                  className="bg-white rounded-xl border border-tropical-sand-border/40 shadow-xs flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-semibold text-sm text-tropical-text-secondary truncate">{trip.title}</h3>
                    <p className="text-xs text-tropical-text-muted">{formatarLocalizacao(trip)} &bull; {formatarPeriodo(trip)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestaurar(trip)}
                      disabled={restaurandoId === trip.id}
                      icon={restaurandoId === trip.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArchiveRestore className="w-3 h-3" />}
                    >
                      {restaurandoId === trip.id ? 'Restaurando...' : 'Restaurar'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => abrirExclusao(trip)}
                      icon={<Trash2 className="w-3 h-3 text-tropical-coral" />}
                      className="text-tropical-coral hover:bg-tropical-coral/5"
                    >
                      Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── MODAIS DE CRIAÇÃO, EDIÇÃO E EXCLUSÃO ──────────────────────────────── */}
      <TripFormModal
        isOpen={modalFormAberto}
        onClose={fecharFormModal}
        trip={tripParaEditar}
      />

      {tripParaExcluir && (
        <DeleteTripModal
          isOpen={modalDeleteAberto}
          onClose={fecharDeleteModal}
          trip={tripParaExcluir}
          onDeleted={fecharDeleteModal}
        />
      )}

    </PageShell>
  );
};
