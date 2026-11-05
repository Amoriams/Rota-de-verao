import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_PARTICIPANTS, MOCK_COUPLES } from '../data/mockData';
import { ConfirmationStatus, TripMemberWithProfile, CoupleStatusView } from '../@types/database.types';

const STORAGE_MEMBERS_KEY = 'rota_de_verao_custom_members';
const STORAGE_COUPLES_KEY = 'rota_de_verao_custom_couples';

function getLocalMembers(): TripMemberWithProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler participantes locais:', err);
    return [];
  }
}

function saveLocalMembers(members: TripMemberWithProfile[]) {
  try {
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Erro ao salvar participantes locais:', err);
  }
}

function getLocalCouples(): CoupleStatusView[] {
  try {
    const raw = localStorage.getItem(STORAGE_COUPLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler casais locais:', err);
    return [];
  }
}

function saveLocalCouples(couples: CoupleStatusView[]) {
  try {
    localStorage.setItem(STORAGE_COUPLES_KEY, JSON.stringify(couples));
  } catch (err) {
    console.error('Erro ao salvar casais locais:', err);
  }
}

export interface JoinTripPayload {
  tripId: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  pin: string;
  isCouple: boolean;
  partnerName?: string;
}

export const memberService = {
  /**
   * Lista participantes de uma viagem específica
   */
  async getMembers(tripId: string): Promise<TripMemberWithProfile[]> {
    if (!isSupabaseConfigured) {
      const local = getLocalMembers().filter((m) => m.trip_id === tripId);
      if (local.length > 0) return local;

      // Fallback para mock apenas se for a viagem padrão de Fortaleza
      if (tripId === 'trip-fortaleza-2027' || tripId === 'trip-rota-verao-2027') {
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

      return [];
    }

    const { data, error } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar membros da viagem:', error);
      throw error;
    }

    return (data as unknown as TripMemberWithProfile[]) || [];
  },

  /**
   * Lista o status dos casais de uma viagem específica
   */
  async getCouplesStatus(tripId: string): Promise<CoupleStatusView[]> {
    if (!isSupabaseConfigured) {
      const local = getLocalCouples().filter((c) => c.trip_id === tripId);
      if (local.length > 0) return local;

      if (tripId === 'trip-fortaleza-2027' || tripId === 'trip-rota-verao-2027') {
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

      return [];
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

  /**
   * Entrada de participante por link direto
   */
  async joinTripByLink(payload: JoinTripPayload): Promise<{ memberId: string; profileId: string }> {
    const { tripId, fullName, nickname, phone, pin, isCouple, partnerName } = payload;

    if (!fullName.trim()) throw new Error('Informe seu nome completo.');
    if (!pin || pin.trim().length !== 6) throw new Error('O código PIN deve conter 6 dígitos.');

    if (!isSupabaseConfigured) {
      const allMembers = getLocalMembers();
      const allCouples = getLocalCouples();

      const profileId = `user-${Date.now()}`;
      const memberId = `member-${Date.now()}`;
      const coupleId = isCouple ? `couple-${Date.now()}` : null;

      const newMember: TripMemberWithProfile = {
        id: memberId,
        trip_id: tripId,
        profile_id: profileId,
        role: 'member',
        confirmation_status: 'confirmed',
        couple_id: coupleId,
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        profile: {
          id: profileId,
          full_name: fullName.trim(),
          nickname: nickname?.trim() || null,
          phone: phone?.trim() || null,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName.trim())}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const updatedMembers = [...allMembers, newMember];

      if (isCouple && partnerName?.trim()) {
        const partnerProfileId = `user-partner-${Date.now()}`;
        const partnerMemberId = `member-partner-${Date.now()}`;

        const partnerMember: TripMemberWithProfile = {
          id: partnerMemberId,
          trip_id: tripId,
          profile_id: partnerProfileId,
          role: 'member',
          confirmation_status: 'pending',
          couple_id: coupleId,
          confirmed_at: null,
          created_at: new Date().toISOString(),
          profile: {
            id: partnerProfileId,
            full_name: partnerName.trim(),
            nickname: null,
            phone: null,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(partnerName.trim())}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };

        updatedMembers.push(partnerMember);

        const newCoupleView: CoupleStatusView = {
          couple_id: coupleId!,
          trip_id: tripId,
          label: `${fullName.trim()} & ${partnerName.trim()}`,
          member_a_id: profileId,
          member_b_id: partnerProfileId,
          member_a_name: fullName.trim(),
          member_b_name: partnerName.trim(),
          member_a_nickname: nickname?.trim() || null,
          member_b_nickname: null,
          member_a_avatar: newMember.profile.avatar_url,
          member_b_avatar: partnerMember.profile.avatar_url,
          member_a_status: 'confirmed',
          member_b_status: 'pending',
          couple_status: 'partial',
        };

        saveLocalCouples([...allCouples, newCoupleView]);
      }

      saveLocalMembers(updatedMembers);

      // Salva credenciais do PIN localmente para permitir login posterior
      const pinsRaw = localStorage.getItem('rota_de_verao_user_pins') || '{}';
      const pins = JSON.parse(pinsRaw);
      pins[pin.trim()] = { profileId, tripId, fullName: fullName.trim() };
      localStorage.setItem('rota_de_verao_user_pins', JSON.stringify(pins));

      return { memberId, profileId };
    }

    // Modo com Supabase: chamada RPC segura para inserção atômica
    const { data, error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: { memberId: string; profileId: string }; error: Error | null }>)('join_trip_by_share_link', {
      p_trip_id: tripId,
      p_full_name: fullName.trim(),
      p_nickname: nickname?.trim() || null,
      p_phone: phone?.trim() || null,
      p_pin: pin.trim(),
      p_is_couple: isCouple,
      p_partner_name: partnerName?.trim() || null,
    });

    if (error) {
      console.error('Erro ao ingressar na viagem:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza o status de confirmação individual de um participante
   */
  async updateConfirmationStatus(
    memberId: string,
    status: ConfirmationStatus
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      const allMembers = getLocalMembers();
      const updated = allMembers.map((m) =>
        m.id === memberId
          ? {
              ...m,
              confirmation_status: status,
              confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
            }
          : m
      );
      saveLocalMembers(updated);
      return;
    }

    const { error } = await supabase
      .from('trip_members')
      .update({
        confirmation_status: status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('id', memberId);

    if (error) throw error;
  },

  /**
   * Remove um participante da viagem (exclusivo para administradora)
   */
  async removeMember(memberId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const allMembers = getLocalMembers();
      saveLocalMembers(allMembers.filter((m) => m.id !== memberId));
      return;
    }

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Erro ao remover participante:', error);
      throw error;
    }
  },
};
