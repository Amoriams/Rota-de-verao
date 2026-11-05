import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_FLIGHTS } from '../data/mockData';
import { Flight } from '../@types/database.types';

export const flightService = {
  async getFlights(tripId: string): Promise<Flight[]> {
    if (!isSupabaseConfigured) {
      return MOCK_FLIGHTS.map((f) => ({
        id: f.id,
        trip_id: tripId,
        airline: f.airline,
        origin_airport: f.originAirport,
        origin_city: f.originCity,
        destination_airport: f.destinationAirport,
        destination_city: f.destinationCity,
        departure_time: f.departureTime,
        arrival_time: f.arrivalTime,
        flight_number: f.flightNumber,
        price: f.price,
        baggage_included: f.baggageIncluded,
        purchase_url: f.purchaseUrl,
        type: f.type,
        created_at: new Date().toISOString(),
      }));
    }

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('trip_id', tripId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao buscar passagens:', error);
      throw error;
    }

    return data || [];
  },
};
