import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_VEHICLES } from '../data/mockData';
import { VehicleWithInterests } from '../@types/database.types';

export const vehicleService = {
  async getVehicles(tripId: string): Promise<VehicleWithInterests[]> {
    if (!isSupabaseConfigured) {
      return MOCK_VEHICLES.map((v) => ({
        id: v.id,
        trip_id: tripId,
        model: v.model,
        category: v.category,
        passenger_capacity: v.passengerCapacity,
        luggage_capacity: v.luggageCapacity,
        daily_rate: v.dailyRate,
        total_days: v.totalDays,
        total_amount: v.totalAmount,
        pickup_location: v.pickupLocation,
        return_location: v.returnLocation,
        rental_company: v.rentalCompany ?? null,
        external_url: v.externalUrl ?? null,
        image_url: v.imageUrl ?? null,
        created_at: new Date().toISOString(),
        interests: v.interestedMemberIds.map((mid) => ({
          id: `int-${mid}`,
          vehicle_id: v.id,
          trip_member_id: mid,
          created_at: new Date().toISOString(),
        })),
        interested_members: [],
      }));
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, interests:vehicle_interests(*)')
      .eq('trip_id', tripId);

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }

    return (data as unknown as VehicleWithInterests[]) || [];
  },

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
