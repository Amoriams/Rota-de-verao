import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_EXPENSES } from '../data/mockData';
import { CostItem } from '../@types/database.types';

export const expenseService = {
  async getExpenses(tripId: string): Promise<CostItem[]> {
    if (!isSupabaseConfigured) {
      return MOCK_EXPENSES.map((e) => ({
        id: e.id,
        trip_id: tripId,
        title: e.title,
        category: e.category,
        total_amount: e.totalAmount,
        split_criterion: e.splitCriterion,
        vehicle_id: null,
        receipt_url: null,
        notes: e.involvedParticipantNames.join(', '),
        due_date: e.dueDate ?? null,
        created_by: 'admin-id',
        created_at: new Date().toISOString(),
      }));
    }

    const { data, error } = await supabase
      .from('cost_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar despesas:', error);
      throw error;
    }

    return data || [];
  },
};
