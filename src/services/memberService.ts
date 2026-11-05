import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_PARTICIPANTS, MOCK_COUPLES } from '../data/mockData';
import { ConfirmationStatus, TripMemberWithProfile, CoupleStatusView } from '../@types/database.types';

export const memberService = {
  async getMembers(tripId: string): Promise<TripMemberWithProfile[]> {
    if (!isSupabaseConfigured) {
      return MOCK_PARTICIPANTS.map((p) => ({
        id: p.id,
        trip_id: tripId,
        profile_id: p.id,
        role: p.role,
        confirmation_status: p.status,
        couple_id: p.coupleId ?? null,
        confirmed_at: p.confirmedAt ?? null,
        created_at: new Date().toISOString(),
        profile: {
          id: p.id,
          full_name: p.name,
          nickname: p.nickname ?? null,
          phone: p.phone ?? null,
          avatar_url: p.avatarUrl ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));
    }

    const { data, error } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId);

    if (error) {
      console.error('Erro ao buscar membros da viagem:', error);
      throw error;
    }

    return (data as unknown as TripMemberWithProfile[]) || [];
  },

  async getCouplesStatus(tripId: string): Promise<CoupleStatusView[]> {
    if (!isSupabaseConfigured) {
      return MOCK_COUPLES.map((c) => ({
        couple_id: c.id,
        trip_id: tripId,
        label: c.label,
        member_a_id: c.memberA.id,
        member_b_id: c.memberB.id,
        member_a_name: c.memberA.name,
        member_b_name: c.memberB.name,
        member_a_nickname: c.memberA.nickname ?? null,
        member_b_nickname: c.memberB.nickname ?? null,
        member_a_avatar: c.memberA.avatarUrl ?? null,
        member_b_avatar: c.memberB.avatarUrl ?? null,
        member_a_status: c.memberA.status,
        member_b_status: c.memberB.status,
        couple_status: (c.memberA.status === 'confirmed' && c.memberB.status === 'confirmed')
          ? 'confirmed'
          : (c.memberA.status === 'declined' && c.memberB.status === 'declined')
          ? 'declined'
          : (c.memberA.status === 'confirmed' || c.memberB.status === 'confirmed')
          ? 'partial'
          : 'pending',
      }));
    }

    const { data, error } = await supabase
      .from('couple_status_view')
      .select('*')
      .eq('trip_id', tripId);

    if (error) {
      console.error('Erro ao buscar status dos casais da view:', error);
      throw error;
    }

    return data || [];
  },

  async updateConfirmationStatus(
    memberId: string,
    status: ConfirmationStatus
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('trip_members')
      .update({
        confirmation_status: status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('id', memberId);

    if (error) throw error;
  },
};
