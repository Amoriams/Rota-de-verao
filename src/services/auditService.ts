import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { ActivityLog } from '../@types/database.types';

export const auditService = {
  async getLogs(tripId: string): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured) {
      return MOCK_ACTIVITY_LOGS.map((l) => ({
        id: l.id,
        trip_id: tripId,
        actor_id: 'actor-id',
        action: l.action,
        entity_name: l.target,
        entity_id: null,
        details: { actorName: l.actorName, timestamp: l.timestamp },
        created_at: new Date().toISOString(),
      }));
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      throw error;
    }

    return data || [];
  },

  async logAction(tripId: string, actorId: string, action: string, entityName: string, details?: Record<string, unknown>): Promise<void> {
    if (!isSupabaseConfigured) return;

    await supabase.from('activity_logs').insert({
      trip_id: tripId,
      actor_id: actorId,
      action,
      entity_name: entityName,
      details: details ?? null,
    });
  },
};
