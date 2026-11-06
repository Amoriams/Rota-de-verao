import React, { useState, useEffect } from 'react';
import { X, Car, AlertCircle, Loader2 } from 'lucide-react';
import { Vehicle, CatalogOptionStatus } from '../../@types/database.types';
import { Button } from '../common/Button';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  vehicleToEdit?: Vehicle | null;
  onSaved: () => void;
  saveVehicle: (payload: any) => Promise<any>;
  updateVehicle: (id: string, payload: any) => Promise<any>;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  tripId,
  vehicleToEdit,
  onSaved,
  saveVehicle,
  updateVehicle,
}) => {
  const isEditing = Boolean(vehicleToEdit);

  const [rentalCompany, setRentalCompany] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [passengerCapacity, setPassengerCapacity] = useState<number>(5);
  const [luggageCapacity, setLuggageCapacity] = useState<number>(3);
  const [dailyRate, setDailyRate] = useState('');
  const [totalDays, setTotalDays] = useState<number>(7);
  const [totalAmount, setTotalAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<CatalogOptionStatus>('in_analysis');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicleToEdit) {
      setRentalCompany(vehicleToEdit.rental_company || '');
      setModel(vehicleToEdit.model);
      setCategory(vehicleToEdit.category);
      setPassengerCapacity(vehicleToEdit.passenger_capacity);
      setLuggageCapacity(vehicleToEdit.luggage_capacity);
      setDailyRate(String(vehicleToEdit.daily_rate));
      setTotalDays(vehicleToEdit.total_days);
      setTotalAmount(String(vehicleToEdit.total_amount));
      setSecurityDeposit(vehicleToEdit.security_deposit ? String(vehicleToEdit.security_deposit) : '');
      setPickupLocation(vehicleToEdit.pickup_location);
      setReturnLocation(vehicleToEdit.return_location);
      setPickupTime(vehicleToEdit.pickup_time?.slice(0, 16) || '');
      setReturnTime(vehicleToEdit.return_time?.slice(0, 16) || '');
      setExternalUrl(vehicleToEdit.external_url || '');
      setImageUrl(vehicleToEdit.image_url || '');
      setStatus(vehicleToEdit.status || 'in_analysis');
      setConditions(vehicleToEdit.conditions || '');
      setNotes(vehicleToEdit.notes || '');
    } else {
      setRentalCompany('');
      setModel('');
      setCategory('SUV');
      setPassengerCapacity(5);
      setLuggageCapacity(3);
      setDailyRate('');
      setTotalDays(7);
      setTotalAmount('');
      setSecurityDeposit('');
      setPickupLocation('Aeroporto de Fortaleza (FOR)');
      setReturnLocation('Aeroporto de Fortaleza (FOR)');
      setPickupTime('');
      setReturnTime('');
      setExternalUrl('');
      setImageUrl('');
      setStatus('in_analysis');
      setConditions('Quilometragem livre, proteção básica inclusa.');
      setNotes('');
    }
    setFormError(null);
  }, [vehicleToEdit, isOpen]);

  // Cálculo automático do total com base na diária e dias
  const handleDailyChange = (val: string) => {
    setDailyRate(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && totalDays > 0) {
      setTotalAmount((parsed * totalDays).toFixed(2));
    }
  };

  const handleDaysChange = (days: number) => {
    setTotalDays(days);
    const parsed = parseFloat(dailyRate.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && days > 0) {
      setTotalAmount((parsed * days).toFixed(2));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!model.trim()) {
      setFormError('Informe o modelo do veículo.');
      return;
    }
    if (!pickupLocation.trim() || !returnLocation.trim()) {
      setFormError('Informe os locais de retirada e devolução.');
      return;
    }

    const parsedRate = parseFloat(dailyRate.replace(',', '.'));
    const parsedTotal = parseFloat(totalAmount.replace(',', '.'));

    if (isNaN(parsedRate) || parsedRate <= 0 || isNaN(parsedTotal) || parsedTotal <= 0) {
      setFormError('Informe valores de diária e valor total válidos.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      trip_id: tripId,
      model: model.trim(),
      category: category.trim(),
      passenger_capacity: Number(passengerCapacity) || 5,
      luggage_capacity: Number(luggageCapacity) || 0,
      daily_rate: parsedRate,
      total_days: Number(totalDays) || 1,
      total_amount: parsedTotal,
      security_deposit: securityDeposit ? parseFloat(securityDeposit.replace(',', '.')) : null,
      pickup_location: pickupLocation.trim(),
      return_location: returnLocation.trim(),
      pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null,
      return_time: returnTime ? new Date(returnTime).toISOString() : null,
      rental_company: rentalCompany.trim() || null,
      external_url: externalUrl.trim() || null,
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      status,
      conditions: conditions.trim() || null,
      notes: notes.trim() || null,
      price_updated_at: new Date().toISOString(),
    };

    try {
      if (isEditing && vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, payload);
      } else {
        await saveVehicle(payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar veículo:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar alternativa de veículo.');
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
            <div className="w-10 h-10 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center">
              <Car className="w-5 h-5 text-tropical-ocean" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-tropical-text">
                {isEditing ? 'Editar Opção de Veículo' : 'Cadastrar Opção de Veículo'}
              </h2>
              <p className="text-xs text-tropical-text-muted">
                Alternativa de locação para translados e passeios da turma.
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
                Modelo / Descrição do Carro *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex.: Jeep Renegade Automático"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Locadora
              </label>
              <input
                type="text"
                value={rentalCompany}
                onChange={(e) => setRentalCompany(e.target.value)}
                placeholder="Ex.: Localiza, Movida"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              >
                <option value="Hatch">Hatch Compacto</option>
                <option value="Sedan">Sedan Médio</option>
                <option value="SUV">SUV Compacto / Médio</option>
                <option value="Minivan">Minivan (7 lugares)</option>
                <option value="Van">Van / Utilitário</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Passageiros
              </label>
              <input
                type="number"
                min={2}
                max={15}
                required
                value={passengerCapacity}
                onChange={(e) => setPassengerCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Capacidade de Malas
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={luggageCapacity}
                onChange={(e) => setLuggageCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/60 border border-tropical-sand-border/50">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Diária (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={dailyRate}
                onChange={(e) => handleDailyChange(e.target.value)}
                placeholder="160.00"
                className="w-full px-3 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Dias Locação
              </label>
              <input
                type="number"
                min={1}
                value={totalDays}
                onChange={(e) => handleDaysChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="1120.00"
                className="w-full px-3 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white font-bold text-tropical-ocean focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Caução / Franquia
              </label>
              <input
                type="number"
                step="0.01"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                placeholder="Ex.: 800.00"
                className="w-full px-3 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text bg-white focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Local de Retirada *
              </label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Ex.: Aeroporto de Fortaleza (FOR)"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Local de Devolução *
              </label>
              <input
                type="text"
                required
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                placeholder="Ex.: Aeroporto de Fortaleza (FOR)"
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Data & Hora de Retirada
              </label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Data & Hora de Devolução
              </label>
              <input
                type="datetime-local"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="booked">✅ Reservada / Locada</option>
                <option value="discarded">❌ Descartada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
                Link da Oferta (Locadora / Rentcars)
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://www.localiza.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
              URL da Foto do Veículo (Opcional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
              Condições Relevantes
            </label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Ex.: KM ilimitado, condutor adicional gratuito, seguro total com franquia reduzida."
              className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1">
              Observações da Administradora
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Carro com porta-malas generoso para acomodar as malas da turma no translado."
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

