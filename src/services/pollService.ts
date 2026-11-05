import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_POLLS } from '../data/mockData';
import { PollWithOptions, PollOptionWithVotes } from '../@types/database.types';

export const pollService = {
  async getPolls(tripId: string, currentMemberId?: string): Promise<PollWithOptions[]> {
    if (!isSupabaseConfigured) {
      return MOCK_POLLS.map((p) => ({
        id: p.id,
        trip_id: tripId,
        title: p.title,
        description: p.description,
        category: p.category,
        allows_change_vote: p.allowsChangeVote,
        is_closed: p.isClosed,
        deadline: p.deadline,
        created_at: new Date().toISOString(),
        options: p.options.map((opt) => ({
          id: opt.id,
          poll_id: p.id,
          title: opt.title,
          description: opt.description ?? null,
          image_url: null,
          external_link: null,
          accommodation_id: null,
          vehicle_id: null,
          created_at: new Date().toISOString(),
          vote_count: opt.voteCount,
          percentage: opt.percentage,
          user_voted: opt.id === p.userVotedOptionId,
        })),
      }));
    }

    // Busca enquetes com opções
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*, options:poll_options(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (pollsError) {
      console.error('Erro ao buscar enquetes:', pollsError);
      throw pollsError;
    }

    if (!pollsData) return [];

    // Busca todos os votos para calcular percentuais
    const { data: votesData } = await supabase
      .from('poll_votes')
      .select('*');

    const votes = votesData || [];

    return (pollsData as Array<Record<string, unknown>>).map((pollRaw) => {
      const pollId = pollRaw.id as string;
      const pollVotes = votes.filter((v) => v.poll_id === pollId);
      const totalVotes = pollVotes.length;

      const rawOptions = (pollRaw.options as Array<Record<string, unknown>>) || [];
      const options: PollOptionWithVotes[] = rawOptions.map((optRaw) => {
        const optId = optRaw.id as string;
        const optVotes = pollVotes.filter((v) => v.poll_option_id === optId).length;
        const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
        const userVoted = currentMemberId
          ? pollVotes.some((v) => v.poll_option_id === optId && v.trip_member_id === currentMemberId)
          : false;

        return {
          id: optId,
          poll_id: pollId,
          title: optRaw.title as string,
          description: (optRaw.description as string | null) ?? null,
          image_url: (optRaw.image_url as string | null) ?? null,
          external_link: (optRaw.external_link as string | null) ?? null,
          accommodation_id: (optRaw.accommodation_id as string | null) ?? null,
          vehicle_id: (optRaw.vehicle_id as string | null) ?? null,
          created_at: (optRaw.created_at as string) || new Date().toISOString(),
          vote_count: optVotes,
          percentage,
          user_voted: userVoted,
        };
      });

      return {
        id: pollId,
        trip_id: pollRaw.trip_id as string,
        title: pollRaw.title as string,
        description: (pollRaw.description as string | null) ?? null,
        category: pollRaw.category as PollWithOptions['category'],
        allows_change_vote: Boolean(pollRaw.allows_change_vote),
        is_closed: Boolean(pollRaw.is_closed),
        deadline: (pollRaw.deadline as string | null) ?? null,
        created_at: (pollRaw.created_at as string) || new Date().toISOString(),
        options,
      };
    });
  },

  async vote(pollId: string, optionId: string, memberId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('poll_votes')
      .upsert(
        {
          poll_id: pollId,
          poll_option_id: optionId,
          trip_member_id: memberId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'poll_id,trip_member_id' }
      );

    if (error) throw error;
  },
};
