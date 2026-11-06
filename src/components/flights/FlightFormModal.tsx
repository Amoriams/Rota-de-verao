import React, { useState, useEffect } from 'react';
import { X, Plane, AlertCircle, Loader2 } from 'lucide-react';
import { Flight, CatalogOptionStatus, FlightType } from '../../@types/database.types';
import { Button } from '../common/Button';

interface FlightFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  flightToEdit?: Flight | null;
  onSaved: () => void;
  saveFlight: (payload: any) => Promise<any>;
  updateFlight: (id: string, payload: any) => Promise<any>;
}

export const FlightFormModal: React.FC<FlightFormModalProps> = ({
  isOpen,
  onClose,
  tripId,
  flightToEdit,
  onSaved,
  saveFlight,
  updateFlight,
}) => {
  const isEditing = Boolean(flightToEdit);

  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [type, setType] = useState<FlightType>('ida');
  const [originAirport, setOriginAirport] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [returnDepartureTime, setReturnDepartureTime] = useState('');
  const [returnArrivalTime, setReturnArrivalTime] = useState('');
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [price, setPrice] = useState('');
  const [baggageIncluded, setBaggageIncluded] = useState(false);
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [status, setStatus] = useState<CatalogOptionStatus>('in_analysis');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (flightToEdit) {
      setAirline(flightToEdit.airline);
      setFlightNumber(flightToEdit.flight_number || '');
      setType(flightToEdit.type);
      setOriginAirport(flightToEdit.origin_airport);
      setOriginCity(flightToEdit.origin_city || '');
      setDestinationAirport(flightToEdit.destination_airport);
      setDestinationCity(flightToEdit.destination_city || '');
      setDepartureTime(flightToEdit.departure_time?.slice(0, 16) || '');
      setArrivalTime(flightToEdit.arrival_time?.slice(0, 16) || '');
      setReturnDepartureTime(flightToEdit.return_departure_time?.slice(0, 16) || '');
      setReturnArrivalTime(flightToEdit.return_arrival_time?.slice(0, 16) || '');
      setConnectionsCount(flightToEdit.connections_count ?? 0);
      setPrice(String(flightToEdit.price));
      setBaggageIncluded(flightToEdit.baggage_included);
      setPurchaseUrl(flightToEdit.purchase_url || '');
      setStatus(flightToEdit.status || 'in_analysis');
      setNotes(flightToEdit.notes || '');
    } else {
      setAirline('');
      setFlightNumber('');
      setType('ida');
      setOriginAirport('');
      setOriginCity('');
      setDestinationAirport('');
      setDestinationCity('');
      setDepartureTime('');
      setArrivalTime('');
      setReturnDepartureTime('');
      setReturnArrivalTime('');
      setConnectionsCount(0);
      setPrice('');
      setBaggageIncluded(false);
      setPurchaseUrl('');
      setStatus('in_analysis');
      setNotes('');
    }
    setFormError(null);
  }, [flightToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!airline.trim()) {
      setFormError('Informe a companhia aérea.');
      return;
    }
    if (!originAirport.trim() || !destinationAirport.trim()) {
      setFormError('Informe os códigos IATA dos aeroportos de origem e destino (Ex: GRU, FOR).');
      return;
    }
    if (!departureTime || !arrivalTime) {
      setFormError('Informe os horários de partida e chegada.');
      return;
    }
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Informe um preço por pessoa válido.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      trip_id: tripId,
      airline: airline.trim(),
      flight_number: flightNumber.trim() || null,
      type,
      origin_airport: originAirport.trim().toUpperCase(),
      origin_city: originCity.trim() || null,
      destination_airport: destinationAirport.trim().toUpperCase(),
      destination_city: destinationCity.trim() || null,
      departure_time: new Date(departureTime).toISOString(),
      arrival_time: new Date(arrivalTime).toISOString(),
      return_departure_time: returnDepartureTime ? new Date(returnDepartureTime).toISOString() : null,
      return_arrival_time: returnArrivalTime ? new Date(returnArrivalTime).toISOString() : null,
      connections_count: Number(connectionsCount) || 0,
      price: parsedPrice,
      baggage_included: baggageIncluded,
      purchase_url: purchaseUrl.trim() || null,
      status,
      notes: notes.trim() || null,
      price_updated_at: new Date().toISOString(),
    };

    try {
      if (isEditing && flightToEdit) {
        await updateFlight(flightToEdit.id, payload);
      } else {
        await saveFlight(payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar opção de passagem:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar alternativa de voo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-tropical-text/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-tropical-lg border border-tropical-sand-border/70 max-w-2xl w-full p-6 sm:p-8 z-10 my-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-tropical-sand-border/40 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-tropical-ocean-50 text-tropical-ocean flex items-center justify-center">
              <Plane className="w-5 h-5 text-tropical-ocean" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-tropical-text">
                {isEditing ? 'Editar Opção de Passagem' : 'Cadastrar Opção de Passagem'}
              </h2>
              <p className="text-xs text-tropical-text-muted">
                Alternativa de voo pesquisada para a turma.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-tropical-text-muted hover:bg-tropical-sand-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-tropical-coral-50 border border-tropical-coral/30 text-tropical-coral text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Companhia Aérea *
              </label>
              <input
                type="text"
                required
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="Ex.: GOL, LATAM, Azul"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Nº do Voo
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="Ex.: G3 1542"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Tipo do Trecho
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FlightType)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              >
                <option value="ida">Somente Ida</option>
                <option value="volta">Ida e Volta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Status da Opção
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CatalogOptionStatus)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean font-medium"
              >
                <option value="in_analysis">🔍 Em análise</option>
                <option value="favorite">⭐ Favorita da Turma</option>
                <option value="chosen">🎯 Escolhida Oficial</option>
                <option value="booked">✅ Reservada / Emitida</option>
                <option value="discarded">❌ Descartada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Origem (IATA) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={originAirport}
                onChange={(e) => setOriginAirport(e.target.value)}
                placeholder="GRU"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm font-mono uppercase text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Cidade Origem
              </label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Destino (IATA) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={destinationAirport}
                onChange={(e) => setDestinationAirport(e.target.value)}
                placeholder="FOR"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm font-mono uppercase text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Cidade Destino
              </label>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="Fortaleza"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Data & Hora de Partida (Ida) *
              </label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Data & Hora de Chegada (Ida) *
              </label>
              <input
                type="datetime-local"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          {type === 'volta' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/60 border border-tropical-sand-border/50">
              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                  Partida do Voo de Volta
                </label>
                <input
                  type="datetime-local"
                  value={returnDepartureTime}
                  onChange={(e) => setReturnDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                  Chegada do Voo de Volta
                </label>
                <input
                  type="datetime-local"
                  value={returnArrivalTime}
                  onChange={(e) => setReturnArrivalTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Preço por Pessoa (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex.: 890.00"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Conexões / Escalas
              </label>
              <select
                value={connectionsCount}
                onChange={(e) => setConnectionsCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              >
                <option value={0}>Direto (Sem escalas)</option>
                <option value={1}>1 Conexão</option>
                <option value={2}>2 Conexões</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-tropical-text select-none">
                <input
                  type="checkbox"
                  checked={baggageIncluded}
                  onChange={(e) => setBaggageIncluded(e.target.checked)}
                  className="w-4 h-4 rounded text-tropical-ocean focus:ring-tropical-ocean"
                />
                Bagagem despachada inclusa
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
              Link da Oferta Externa (Companhia / Agência)
            </label>
            <input
              type="url"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="https://www.voegol.com.br/..."
              className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
              Observações & Recomendações da Administradora
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Melhor horário para quem sai após o expediente. Tarifa com marcação de assento gratuita."
              className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-tropical-sand-border/40">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Opção' : 'Cadastrar Opção'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

