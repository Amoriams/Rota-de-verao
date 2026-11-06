import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Flight } from '../@types/database.types';

const STORAGE_FLIGHTS_KEY = 'rota_de_verao_custom_flights';

function getLocalFlights(): Flight[] {
  try {
    const raw = localStorage.getItem(STORAGE_FLIGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler passagens locais:', err);
    return [];
  }
}

function saveLocalFlights(flights: Flight[]) {
  try {
    localStorage.setItem(STORAGE_FLIGHTS_KEY, JSON.stringify(flights));
  } catch (err) {
    console.error('Erro ao salvar passagens locais:', err);
  }
}

export const flightService = {
  /**
   * Lista todas as opções de voos para a viagem indicada
   */
  async getFlights(tripId: string): Promise<Flight[]> {
    if (!tripId) return [];

    if (!isSupabaseConfigured) {
      const local = getLocalFlights().filter((f) => f.trip_id === tripId);
      return local.sort((a, b) => a.price - b.price);
    }

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('trip_id', tripId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao buscar passagens do Supabase:', error);
      throw error;
    }

    return (data as Flight[]) || [];
  },

  /**
   * Cadastra uma nova alternativa de passagem aérea
   */
  async createFlight(payload: Omit<Flight, 'id' | 'created_at'>): Promise<Flight> {
    const newFlight: Flight = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price_updated_at: payload.price_updated_at || new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const all = getLocalFlights();
      saveLocalFlights([newFlight, ...all]);
      return newFlight;
    }

    const { data, error } = await supabase
      .from('flights')
      .insert({
        id: newFlight.id,
        trip_id: newFlight.trip_id,
        airline: newFlight.airline,
        origin_airport: newFlight.origin_airport,
        origin_city: newFlight.origin_city,
        destination_airport: newFlight.destination_airport,
        destination_city: newFlight.destination_city,
        departure_time: newFlight.departure_time,
        arrival_time: newFlight.arrival_time,
        flight_number: newFlight.flight_number,
        price: newFlight.price,
        baggage_included: newFlight.baggage_included,
        purchase_url: newFlight.purchase_url,
        type: newFlight.type,
        status: newFlight.status,
        connections_count: newFlight.connections_count,
        notes: newFlight.notes,
        price_updated_at: newFlight.price_updated_at,
        return_departure_time: newFlight.return_departure_time,
        return_arrival_time: newFlight.return_arrival_time,
        created_by: newFlight.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar passagem no Supabase:', error);
      throw error;
    }

    return data as Flight;
  },

  /**
   * Atualiza dados de uma alternativa existente
   */
  async updateFlight(flightId: string, updates: Partial<Flight>): Promise<void> {
    if (!isSupabaseConfigured) {
      const all = getLocalFlights();
      const updated = all.map((f) =>
        f.id === flightId
          ? { ...f, ...updates, updated_at: new Date().toISOString() }
          : f
      );
      saveLocalFlights(updated);
      return;
    }

    const { error } = await supabase
      .from('flights')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flightId);

    if (error) {
      console.error('Erro ao atualizar passagem:', error);
      throw error;
    }
  },

  /**
   * Exclui uma alternativa de voo
   */
  async deleteFlight(flightId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const all = getLocalFlights();
      saveLocalFlights(all.filter((f) => f.id !== flightId));
      return;
    }

    const { error } = await supabase
      .from('flights')
      .delete()
      .eq('id', flightId);

    if (error) {
      console.error('Erro ao excluir passagem:', error);
      throw error;
    }
  },
};
