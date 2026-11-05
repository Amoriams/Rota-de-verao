import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  CalendarDays,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Trip } from '../@types/database.types';
import { useTrip } from '../contexts/TripContext';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/common/Button';
import { EmptyTripState } from '../components/common/EmptyTripState';
import { TripFormModal } from '../components/trips/TripFormModal';
import { DeleteTripModal } from '../components/trips/DeleteTripModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formata uma data ISO (YYYY-MM-DD) no padrão legível em pt-BR.
 * Ex.: "2027-01-15" → "15 de jan. de 2027"
 */
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
  return 'Sem período definido';
}

function formatarLocalizacao(trip: Trip): string {
  const partes = [trip.destination, trip.city, trip.state, trip.country].filter(Boolean);
  return partes.join(', ') || '—';
}

// ─── Gradiente de placeholder quando não há imagem de capa ───────────────────

const GRADIENTE_PLACEHOLDER =
  'bg-gradient-to-br from-tropical-ocean via-tropical-turquoise to-tropical-palm';

// ─── Sub-componente: Card de Viagem Ativa ─────────────────────────────────────

interface TripCardProps {
  trip: Trip;
  isSelecionada: boolean;
  onSelecionar: () => void;
  onEditar: () => void;
  onArquivar: () => void;
  onExcluir: () => void;
  arquivando: boolean;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  isSelecionada,
  onSelecionar,
  onEditar,
  onArquivar,
  onExcluir,
  arquivando,
}) => {
  return (
    <article className="tropical-card flex flex-col overflow-hidden group">
      {/* Imagem de capa ou placeholder */}
      <div className="relative h-36 overflow-hidden shrink-0">
        {trip.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt={`Capa de ${trip.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full ${GRADIENTE_PLACEHOLDER} flex items-center justify-center`}>
            <ImageIcon className="w-8 h-8 text-white/50" />
          </div>
        )}

        {/* Badge de status */}
        <div className="absolute top-3 right-3">
          {isSelecionada ? (
            <span className="badge-tropical bg-tropical-ocean text-white shadow-tropical-sm">
              <CheckCircle2 className="w-3 h-3" />
              Selecionada
            </span>
          ) : (
            <span className="badge-tropical bg-white/90 text-tropical-text-secondary border border-tropical-sand-border/50">
              Ativa
            </span>
          )}
        </div>
      </div>

      {/* Corpo do card */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-base text-tropical-text leading-tight truncate">
            {trip.title}
          </h3>

          <p className="flex items-start gap-1 text-xs text-tropical-text-muted">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-tropical-coral" />
            <span className="line-clamp-2">{formatarLocalizacao(trip)}</span>
          </p>

          <p className="flex items-center gap-1 text-xs text-tropical-text-muted">
            <CalendarDays className="w-3 h-3 shrink-0 text-tropical-turquoise" />
            {formatarPeriodo(trip)}
          </p>
        </div>

        {/* Ações */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 border-t border-tropical-sand-border/30">
          <Button
            size="sm"
            variant="primary"
            disabled={isSelecionada}
            onClick={onSelecionar}
            title={isSelecionada ? 'Já é a viagem selecionada' : 'Selecionar esta viagem'}
          >
            {isSelecionada ? 'Selecionada' : 'Selecionar'}
          </Button>

          <Button size="sm" variant="outline" onClick={onEditar} icon={<Edit2 className="w-3 h-3" />}>
            Editar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onArquivar}
            disabled={arquivando}
            icon={arquivando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
            title="Arquivar viagem"
          >
            {arquivando ? 'Arquivando...' : 'Arquivar'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onExcluir}
            icon={<Trash2 className="w-3 h-3 text-tropical-coral" />}
            className="text-tropical-coral hover:text-tropical-coral hover:bg-tropical-coral/5"
            title="Excluir viagem"
          >
            Excluir
          </Button>
        </div>
      </div>
    </article>
  );
};

// ─── Sub-componente: Card de Viagem Arquivada ─────────────────────────────────

interface ArchivedTripCardProps {
  trip: Trip;
  onRestaurar: () => void;
  onExcluir: () => void;
  restaurando: boolean;
}

const ArchivedTripCard: React.FC<ArchivedTripCardProps> = ({
  trip,
  onRestaurar,
  onExcluir,
  restaurando,
}) => (
  <article className="bg-white rounded-xl border border-tropical-sand-border/40 shadow-xs flex items-center gap-4 px-4 py-3">
    <div className="flex-1 min-w-0 space-y-0.5">
      <h3 className="font-semibold text-sm text-tropical-text-secondary truncate">{trip.title}</h3>
      <p className="flex items-center gap-1 text-xs text-tropical-text-muted">
        <MapPin className="w-3 h-3 shrink-0 text-tropical-coral/70" />
        {formatarLocalizacao(trip)}
      </p>
      <p className="flex items-center gap-1 text-xs text-tropical-text-muted">
        <CalendarDays className="w-3 h-3 shrink-0 text-tropical-turquoise/70" />
        {formatarPeriodo(trip)}
      </p>
    </div>

    {/* Badge arquivada */}
    <span className="badge-tropical bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border shrink-0">
      Arquivada
    </span>

    {/* Ações */}
    <div className="flex items-center gap-1.5 shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={onRestaurar}
        disabled={restaurando}
        icon={restaurando ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArchiveRestore className="w-3 h-3" />}
      >
        {restaurando ? 'Restaurando...' : 'Restaurar'}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onExcluir}
        icon={<Trash2 className="w-3 h-3 text-tropical-coral" />}
        className="text-tropical-coral hover:text-tropical-coral hover:bg-tropical-coral/5"
      >
        Excluir
      </Button>
    </div>
  </article>
);

// ─── Página Principal ─────────────────────────────────────────────────────────

export const MyTrips: React.FC = () => {
  const { activeTrips, archivedTrips, currentTrip, isLoading, selectTrip, archiveTrip, restoreTrip } =
    useTrip();

  // ── Estado dos modais ──────────────────────────────────────────────────────
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [tripParaEditar, setTripParaEditar] = useState<Trip | null>(null);

  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [tripParaExcluir, setTripParaExcluir] = useState<Trip | null>(null);

  // ── Estado da seção de arquivadas ──────────────────────────────────────────
  const [secaoArquivadasAberta, setSecaoArquivadasAberta] = useState(false);

  // ── Estado de operações assíncronas por item ───────────────────────────────
  const [arquivandoId, setArquivandoId] = useState<string | null>(null);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);

  // ── Handlers de criação / edição ──────────────────────────────────────────

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

  // ── Handlers de exclusão ──────────────────────────────────────────────────

  const abrirExclusao = (trip: Trip) => {
    setTripParaExcluir(trip);
    setModalDeleteAberto(true);
  };

  const fecharDeleteModal = () => {
    setModalDeleteAberto(false);
    setTripParaExcluir(null);
  };

  // ── Handler de arquivamento ───────────────────────────────────────────────

  const handleArquivar = async (trip: Trip) => {
    if (arquivandoId) return; // evita duplo clique
    setArquivandoId(trip.id);
    try {
      await archiveTrip(trip.id);
    } finally {
      setArquivandoId(null);
    }
  };

  // ── Handler de restauração ────────────────────────────────────────────────

  const handleRestaurar = async (trip: Trip) => {
    if (restaurandoId) return;
    setRestaurandoId(trip.id);
    try {
      await restoreTrip(trip.id);
    } finally {
      setRestaurandoId(null);
    }
  };

  // ── Estado de carregamento ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-tropical-ocean" />
        </div>
      </PageShell>
    );
  }

  // ── Estado vazio ──────────────────────────────────────────────────────────

  if (!isLoading && activeTrips.length === 0 && archivedTrips.length === 0) {
    return (
      <PageShell>
        <EmptyTripState onCreateTrip={abrirCriacao} isAdmin />
        <TripFormModal isOpen={modalFormAberto} onClose={fecharFormModal} trip={tripParaEditar} />
      </PageShell>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <PageShell>
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-tropical-text tracking-tight">
            Minhas Viagens
          </h1>
          <p className="text-sm text-tropical-text-muted mt-1">
            Gerencie suas viagens ativas e arquivadas.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={abrirCriacao}
          icon={<Plus className="w-4 h-4" />}
        >
          Nova Viagem
        </Button>
      </div>

      {/* ── Seção: Viagens Ativas ─────────────────────────────────────────── */}

      {activeTrips.length > 0 ? (
        <section aria-label="Viagens ativas" className="mb-10">
          <h2 className="text-xs font-bold text-tropical-text-secondary uppercase tracking-widest mb-4">
            Viagens Ativas ({activeTrips.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isSelecionada={trip.id === currentTrip?.id}
                onSelecionar={() => selectTrip(trip.id)}
                onEditar={() => abrirEdicao(trip)}
                onArquivar={() => handleArquivar(trip)}
                onExcluir={() => abrirExclusao(trip)}
                arquivando={arquivandoId === trip.id}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="mb-10 p-6 rounded-2xl bg-tropical-sand-50 border border-tropical-sand-border/50 text-center">
          <p className="text-sm text-tropical-text-muted">Nenhuma viagem ativa no momento.</p>
          <Button variant="outline" size="sm" onClick={abrirCriacao} className="mt-3" icon={<Plus className="w-3.5 h-3.5" />}>
            Criar viagem
          </Button>
        </div>
      )}

      {/* ── Seção: Viagens Arquivadas (colapsável) ───────────────────────── */}

      {archivedTrips.length > 0 && (
        <section aria-label="Viagens arquivadas">
          {/* Toggle da seção */}
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
                <ArchivedTripCard
                  key={trip.id}
                  trip={trip}
                  onRestaurar={() => handleRestaurar(trip)}
                  onExcluir={() => abrirExclusao(trip)}
                  restaurando={restaurandoId === trip.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Modais ───────────────────────────────────────────────────────── */}

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
