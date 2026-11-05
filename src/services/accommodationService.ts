import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ACCOMMODATIONS } from '../data/mockData';
import { Accommodation } from '../@types/database.types';

export const accommodationService = {
  async getAccommodations(tripId: string): Promise<Accommodation[]> {
    if (!isSupabaseConfigured) {
      return MOCK_ACCOMMODATIONS.map((a) => ({
        id: a.id,
        trip_id: tripId,
        name: a.name,
        address: a.address,
        photos: a.photos,
        bedrooms_count: a.bedroomsCount,
        total_capacity: a.totalCapacity,
        total_amount: a.totalAmount,
        price_per_person_estimated: a.pricePerPersonEstimated,
        external_url: a.externalUrl ?? null,
        notes: a.amenities.join(', '),
        is_favorite: Boolean(a.isFavorite),
        created_at: new Date().toISOString(),
      }));
    }

    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('trip_id', tripId)
      .order('is_favorite', { ascending: false });

    if (error) {
      console.error('Erro ao buscar acomodações:', error);
      throw error;
    }

    return data || [];
  },
};
