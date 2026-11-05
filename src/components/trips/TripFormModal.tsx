import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, MapPin, Calendar, FileText, Image, DollarSign } from 'lucide-react';
import { Trip } from '../../@types/database.types';
import { useTrip } from '../../contexts/TripContext';
import { Button } from '../common/Button';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip | null; // modo edição quando fornecido; modo criação quando null/undefined
}

/** Dados controlados pelo formulário (subconjunto de Trip) */
interface TripFormData {
  title: string;
  destination: string;
  city: string;
  state: string;
  country: string;
  start_date: string;
  end_date: string;
  description: string;
  cover_image_url: string;
  estimated_budget_per_person: string; // string para facilitar input numérico
}

const FORM_VAZIO: TripFormData = {
  title: '',
  destination: '',
  city: '',
  state: '',
  country: '',
  start_date: '',
  end_date: '',
  description: '',
  cover_image_url: '',
  estimated_budget_per_person: '',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const TripFormModal: React.FC<TripFormModalProps> = ({ isOpen, onClose, trip }) => {
  const { createTrip, updateTrip } = useTrip();

  const modoEdicao = Boolean(trip);

  const [form, setForm] = useState<TripFormData>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche o formulário quando entra em modo edição
  useEffect(() => {
    if (trip) {
      setForm({
        title: trip.title ?? '',
        destination: trip.destination ?? '',
        city: trip.city ?? '',
        state: trip.state ?? '',
        country: trip.country ?? '',
        start_date: trip.start_date ?? '',
        end_date: trip.end_date ?? '',
        description: trip.description ?? '',
        cover_image_url: trip.cover_image_url ?? '',
        estimated_budget_per_person:
          trip.estimated_budget_per_person != null
            ? String(trip.estimated_budget_per_person)
            : '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro(null);
  }, [trip, isOpen]);

  if (!isOpen) return null;

  // ── Helpers de campo ──────────────────────────────────────────────────────

  const atualizarCampo = <K extends keyof TripFormData>(campo: K, valor: TripFormData[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro(null);
  };

  // ── Validação ─────────────────────────────────────────────────────────────

  const validar = (): string | null => {
    if (!form.title.trim()) return 'O nome da viagem é obrigatório.';
    if (!form.destination.trim()) return 'O destino é obrigatório.';
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return 'A data de retorno deve ser igual ou posterior à data de saída.';
    }
    if (form.estimated_budget_per_person && isNaN(Number(form.estimated_budget_per_person))) {
      return 'O orçamento estimado deve ser um número válido.';
    }
    return null;
  };

  // ── Submissão ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mensagemErro = validar();
    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    setSalvando(true);
    setErro(null);

    // Monta payload sem campos vazios desnecessários
    const payload: Partial<Trip> = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country.trim() || null,
      start_date: form.start_date || null as unknown as string,
      end_date: form.end_date || null as unknown as string,
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      estimated_budget_per_person: form.estimated_budget_per_person
        ? Number(form.estimated_budget_per_person)
        : null,
    };

    try {
      if (modoEdicao && trip) {
        await updateTrip(trip.id, payload);
      } else {
        await createTrip(payload);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a viagem.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Overlay com backdrop-blur
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={modoEdicao ? 'Editar viagem' : 'Nova viagem'}
    >
      {/* Backdrop escuro */}
      <div
        className="absolute inset-0 bg-tropical-text/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card do modal */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-tropical-lg flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-tropical-sand-border/40 shrink-0">
          <div>
            <h2 className="font-display font-extrabold text-xl text-tropical-text tracking-tight">
              {modoEdicao ? 'Editar Viagem' : 'Nova Viagem'}
            </h2>
            <p className="text-xs text-tropical-text-muted mt-0.5">
              {modoEdicao
                ? 'Atualize as informações da viagem.'
                : 'Preencha os dados para criar uma nova viagem.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={salvando}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-tropical-text-muted hover:bg-tropical-sand-100 hover:text-tropical-text transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <form
          id="trip-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-5 flex-1"
        >
          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-tropical-coral-50 border border-tropical-coral/30 text-tropical-coral text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Campos obrigatórios */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-tropical-text-secondary uppercase tracking-widest mb-3">
              Informações Essenciais
            </legend>

            {/* Nome da viagem */}
            <div>
              <label
                htmlFor="trip-title"
                className="block text-sm font-semibold text-tropical-text mb-1.5"
              >
                Nome da Viagem <span className="text-tropical-coral">*</span>
              </label>
              <input
                id="trip-title"
                type="text"
                value={form.title}
                onChange={(e) => atualizarCampo('title', e.target.value)}
                placeholder="Ex: Verão em Florianópolis"
                maxLength={120}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
              />
            </div>

            {/* Destino */}
            <div>
              <label
                htmlFor="trip-destination"
                className="block text-sm font-semibold text-tropical-text mb-1.5"
              >
                <MapPin className="w-3.5 h-3.5 inline-block mr-1 text-tropical-coral" />
                Destino <span className="text-tropical-coral">*</span>
              </label>
              <input
                id="trip-destination"
                type="text"
                value={form.destination}
                onChange={(e) => atualizarCampo('destination', e.target.value)}
                placeholder="Ex: Florianópolis"
                maxLength={120}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
              />
            </div>
          </fieldset>

          {/* Localização detalhada */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-tropical-text-secondary uppercase tracking-widest mb-3">
              Localização Detalhada
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cidade */}
              <div>
                <label htmlFor="trip-city" className="block text-sm font-semibold text-tropical-text mb-1.5">
                  Cidade
                </label>
                <input
                  id="trip-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => atualizarCampo('city', e.target.value)}
                  placeholder="Cidade"
                  maxLength={80}
                  className="w-full px-3 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
                />
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="trip-state" className="block text-sm font-semibold text-tropical-text mb-1.5">
                  Estado
                </label>
                <input
                  id="trip-state"
                  type="text"
                  value={form.state}
                  onChange={(e) => atualizarCampo('state', e.target.value)}
                  placeholder="Estado / UF"
                  maxLength={60}
                  className="w-full px-3 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
                />
              </div>

              {/* País */}
              <div>
                <label htmlFor="trip-country" className="block text-sm font-semibold text-tropical-text mb-1.5">
                  País
                </label>
                <input
                  id="trip-country"
                  type="text"
                  value={form.country}
                  onChange={(e) => atualizarCampo('country', e.target.value)}
                  placeholder="País"
                  maxLength={80}
                  className="w-full px-3 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
                />
              </div>
            </div>
          </fieldset>

          {/* Datas */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-tropical-text-secondary uppercase tracking-widest mb-3">
              <Calendar className="w-3.5 h-3.5 inline-block mr-1" />
              Período da Viagem
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data de saída */}
              <div>
                <label htmlFor="trip-start" className="block text-sm font-semibold text-tropical-text mb-1.5">
                  Data de Saída
                </label>
                <input
                  id="trip-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => atualizarCampo('start_date', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
                />
              </div>

              {/* Data de retorno */}
              <div>
                <label htmlFor="trip-end" className="block text-sm font-semibold text-tropical-text mb-1.5">
                  Data de Retorno
                </label>
                <input
                  id="trip-end"
                  type="date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={(e) => atualizarCampo('end_date', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
                />
              </div>
            </div>
          </fieldset>

          {/* Extras */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold text-tropical-text-secondary uppercase tracking-widest mb-3">
              Detalhes Adicionais
            </legend>

            {/* Descrição */}
            <div>
              <label htmlFor="trip-description" className="block text-sm font-semibold text-tropical-text mb-1.5">
                <FileText className="w-3.5 h-3.5 inline-block mr-1 text-tropical-turquoise" />
                Descrição
              </label>
              <textarea
                id="trip-description"
                value={form.description}
                onChange={(e) => atualizarCampo('description', e.target.value)}
                placeholder="Conte um pouco sobre esta viagem..."
                rows={3}
                maxLength={600}
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors resize-none"
              />
            </div>

            {/* URL da imagem de capa */}
            <div>
              <label htmlFor="trip-cover" className="block text-sm font-semibold text-tropical-text mb-1.5">
                <Image className="w-3.5 h-3.5 inline-block mr-1 text-tropical-turquoise" />
                URL da Imagem de Capa
              </label>
              <input
                id="trip-cover"
                type="url"
                value={form.cover_image_url}
                onChange={(e) => atualizarCampo('cover_image_url', e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
              />
            </div>

            {/* Orçamento estimado */}
            <div>
              <label htmlFor="trip-budget" className="block text-sm font-semibold text-tropical-text mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline-block mr-1 text-tropical-turquoise" />
                Orçamento Estimado por Pessoa (R$)
              </label>
              <input
                id="trip-budget"
                type="number"
                min={0}
                step={0.01}
                value={form.estimated_budget_per_person}
                onChange={(e) => atualizarCampo('estimated_budget_per_person', e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text placeholder:text-tropical-text-muted/60 focus:outline-none focus:ring-2 focus:ring-tropical-ocean/40 focus:border-tropical-ocean transition-colors"
              />
            </div>
          </fieldset>
        </form>

        {/* Rodapé com ações */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-tropical-sand-border/40 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="trip-form"
            variant="primary"
            disabled={salvando}
            icon={salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {salvando
              ? (modoEdicao ? 'Salvando...' : 'Criando...')
              : (modoEdicao ? 'Salvar Alterações' : 'Criar Viagem')}
          </Button>
        </div>
      </div>
    </div>
  );
};
