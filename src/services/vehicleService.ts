import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { VehicleWithInterests, Vehicle } from '../@types/database.types';

const STORAGE_VEHICLES_KEY = 'rota_de_verao_custom_vehicles';

function getLocalVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_VEHICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler veículos locais:', err);
    return [];
  }
}

function saveLocalVehicles(vehicles: Vehicle[]) {
  try {
    localStorage.setItem(STORAGE_VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (err) {
    console.error('Erro ao salvar veículos locais:', err);
  }
}

export const vehicleService = {
  /**
   * Lista todas as opções de veículos e interesses para a viagem indicada
   */
  async getVehicles(tripId: string): Promise<VehicleWithInterests[]> {
    if (!tripId) return [];

    if (!isSupabaseConfigured) {
      const local = getLocalVehicles().filter((v) => v.trip_id === tripId);
      return local.map((v) => ({
        ...v,
        interests: [],
        interested_members: [],
      }));
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, interests:vehicle_interests(*)')
      .eq('trip_id', tripId)
      .order('total_amount', { ascending: true });

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }

    return (data as unknown as VehicleWithInterests[]) || [];
  },

  /**
   * Cadastra uma nova alternativa de veículo
   */
  async createVehicle(payload: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price_updated_at: payload.price_updated_at || new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const all = getLocalVehicles();
      saveLocalVehicles([newVehicle, ...all]);
      return newVehicle;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        id: newVehicle.id,
        trip_id: newVehicle.trip_id,
        model: newVehicle.model,
        category: newVehicle.category,
        passenger_capacity: newVehicle.passenger_capacity,
        luggage_capacity: newVehicle.luggage_capacity,
        daily_rate: newVehicle.daily_rate,
        total_days: newVehicle.total_days,
        total_amount: newVehicle.total_amount,
        pickup_location: newVehicle.pickup_location,
        return_location: newVehicle.return_location,
        rental_company: newVehicle.rental_company,
        external_url: newVehicle.external_url,
        image_url: newVehicle.image_url,
        status: newVehicle.status,
        pickup_time: newVehicle.pickup_time,
        return_time: newVehicle.return_time,
        security_deposit: newVehicle.security_deposit,
        conditions: newVehicle.conditions,
        notes: newVehicle.notes,
        price_updated_at: newVehicle.price_updated_at,
        created_by: newVehicle.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar veículo no Supabase:', error);
      throw error;
    }

    return data as Vehicle;
  },

  /**
   * Atualiza dados de uma alternativa existente
   */
  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    if (!isSupabaseConfigured) {
      const all = getLocalVehicles();
      const updated = all.map((v) =>
        v.id === vehicleId
          ? { ...v, ...updates, updated_at: new Date().toISOString() }
          : v
      );
      saveLocalVehicles(updated);
      return;
    }

    const { error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    if (error) {
      console.error('Erro ao atualizar veículo:', error);
      throw error;
    }
  },

  /**
   * Exclui uma alternativa de veículo
   */
  async deleteVehicle(vehicleId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const all = getLocalVehicles();
      saveLocalVehicles(all.filter((v) => v.id !== vehicleId));
      return;
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      console.error('Erro ao excluir veículo:', error);
      throw error;
    }
  },

  /**
   * Alterna interesse do participante no veículo
   */
  async toggleInterest(vehicleId: string, memberId: string, currentlyInterested: boolean): Promise<void> {
    if (!isSupabaseConfigured) return;

    if (currentlyInterested) {
      await supabase
        .from('vehicle_interests')
        .delete()
        .eq('vehicle_id', vehicleId)
        .eq('trip_member_id', memberId);
    } else {
      await supabase
        .from('vehicle_interests')
        .insert({ vehicle_id: vehicleId, trip_member_id: memberId });
    }
  },
};
