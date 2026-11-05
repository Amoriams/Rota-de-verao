import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { Trip } from '../../@types/database.types';
import { useTrip } from '../../contexts/TripContext';
import { Button } from '../common/Button';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DeleteTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onDeleted?: () => void;
}

// ─── Lista dos dados que serão removidos (exibida ao usuário) ─────────────────

const DADOS_REMOVIDOS = [
  'Participantes e confirmações',
  'Passagens aéreas cadastradas',
  'Hospedagens e enquetes',
  'Veículos e interesses',
  'Despesas e rateios',
  'Convites e histórico de auditoria',
];

// ─── Componente ───────────────────────────────────────────────────────────────

export const DeleteTripModal: React.FC<DeleteTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  onDeleted,
}) => {
  const { deleteTrip } = useTrip();

  const [confirmacaoTexto, setConfirmacaoTexto] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  // O botão só é habilitado quando o texto digitado bate exatamente com o nome da viagem
  const confirmacaoValida = confirmacaoTexto === trip.title;

  // ── Submissão ─────────────────────────────────────────────────────────────

  const handleExcluir = async () => {
    if (!confirmacaoValida) return;

    setExcluindo(true);
    setErro(null);

    try {
      await deleteTrip(trip.id);
      onDeleted?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro ao excluir a viagem.';
      setErro(msg);
    } finally {
      setExcluindo(false);
    }
  };

  const handleFechar = () => {
    if (excluindo) return;
    setConfirmacaoTexto('');
    setErro(null);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar exclusão de viagem"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-tropical-text/50 backdrop-blur-sm"
        onClick={handleFechar}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-tropical-lg overflow-hidden">
        {/* Cabeçalho com destaque de perigo */}
        <div className="px-6 py-5 bg-red-50 border-b border-red-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-tropical-coral text-white flex items-center justify-center shrink-0 shadow-tropical-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-tropical-text tracking-tight">
                Excluir Viagem
              </h2>
              <p className="text-xs text-tropical-text-muted mt-0.5">
                Esta ação é <strong className="text-tropical-coral">permanente</strong> e irreversível.
              </p>
            </div>
          </div>

          <button
            onClick={handleFechar}
            disabled={excluindo}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-tropical-text-muted hover:bg-red-100 hover:text-tropical-coral transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 space-y-5">
          {/* Aviso principal */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-tropical-coral/5 border border-tropical-coral/20">
            <AlertTriangle className="w-5 h-5 text-tropical-coral shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-tropical-text">
                Você está prestes a excluir:
              </p>
              <p className="text-sm text-tropical-coral font-bold break-words">
                "{trip.title}"
              </p>
            </div>
          </div>

          {/* Lista de dados que serão removidos */}
          <div>
            <p className="text-xs font-semibold text-tropical-text-secondary uppercase tracking-widest mb-2">
              Todos estes dados serão removidos:
            </p>
            <ul className="space-y-1.5">
              {DADOS_REMOVIDOS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-tropical-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-tropical-coral shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Campo de confirmação */}
          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-semibold text-tropical-text mb-1.5">
              Para confirmar, digite o nome da viagem:
            </label>
            <p className="text-xs text-tropical-text-muted mb-2 font-mono bg-tropical-sand-50 px-3 py-1.5 rounded-lg border border-tropical-sand-border inline-block">
              {trip.title}
            </p>
            <input
              id="confirm-delete"
              type="text"
              value={confirmacaoTexto}
              onChange={(e) => {
                setConfirmacaoTexto(e.target.value);
                setErro(null);
              }}
              placeholder={trip.title}
              disabled={excluindo}
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/50 focus:outline-none focus:ring-2 focus:ring-tropical-coral/40 focus:border-tropical-coral transition-colors disabled:opacity-50"
            />
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-tropical-coral-50 border border-tropical-coral/30 text-tropical-coral text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}
        </div>

        {/* Rodapé com ações */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-tropical-sand-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={handleFechar}
            disabled={excluindo}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="coral"
            disabled={!confirmacaoValida || excluindo}
            onClick={handleExcluir}
            icon={excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          >
            {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </div>
      </div>
    </div>
  );
};
