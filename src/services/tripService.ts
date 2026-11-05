import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_TRIP } from '../data/mockData';
import { Trip } from '../@types/database.types';

export const tripService = {
  async getTrip(): Promise<Trip> {
    if (!isSupabaseConfigured) {
      // Fallback para mock enquanto credenciais não forem adicionadas
      return {
        id: MOCK_TRIP.id,
        title: MOCK_TRIP.title,
        destination: MOCK_TRIP.destination,
        state: MOCK_TRIP.state,
        start_date: MOCK_TRIP.startDate,
        end_date: MOCK_TRIP.endDate,
        cover_image_url: MOCK_TRIP.coverImageUrl,
        description: MOCK_TRIP.description,
        estimated_budget_per_person: MOCK_TRIP.estimatedBudgetPerPerson,
        created_by: 'admin-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar dados da viagem:', error);
      throw error;
    }

    if (!data) {
      // Se ainda não existir viagem no banco, retorna mock padrão
      return {
        id: MOCK_TRIP.id,
        title: MOCK_TRIP.title,
        destination: MOCK_TRIP.destination,
        state: MOCK_TRIP.state,
        start_date: MOCK_TRIP.startDate,
        end_date: MOCK_TRIP.endDate,
        cover_image_url: MOCK_TRIP.coverImageUrl,
        description: MOCK_TRIP.description,
        estimated_budget_per_person: MOCK_TRIP.estimatedBudgetPerPerson,
        created_by: 'admin-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  },

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId);

    if (error) throw error;
  },
};
