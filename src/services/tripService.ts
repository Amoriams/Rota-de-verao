import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Trip } from '../@types/database.types';

const STORAGE_KEY = 'rota_de_verao_multi_trips';

// Helper local para carregar viagens salvas localmente
function getLocalTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler viagens locais:', err);
    return [];
  }
}

function saveLocalTrips(trips: Trip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Erro ao salvar viagens locais:', err);
  }
}

// Helper para formatar erros do PostgREST/Supabase de forma legível
function formatSupabaseError(action: string, error: { message?: string; details?: string; hint?: string; code?: string }): Error {
  const code = error.code ? `[${error.code}] ` : '';
  const message = error.message || error.details || 'Falha na comunicação com o banco de dados.';
  console.error(`Erro ao ${action} no Supabase: ${code}${message}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  return new Error(`${message}${error.hint ? ` (${error.hint})` : ''}`);
}

export const tripService = {
  /**
   * Lista todas as viagens acessíveis pelo usuário atual
   */
  async getTrips(options?: { includeArchived?: boolean }): Promise<Trip[]> {
    if (!isSupabaseConfigured) {
      const trips = getLocalTrips();
      if (!options?.includeArchived) {
        return trips.filter((t) => !t.is_archived);
      }
      return trips;
    }

    let query = supabase.from('trips').select('*').order('created_at', { ascending: false });

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      throw formatSupabaseError('buscar viagens', error);
    }

    return data || [];
  },

  /**
   * Busca uma viagem específica pelo ID
   */
  async getTripById(tripId: string): Promise<Trip | null> {
    if (!tripId) return null;

    if (!isSupabaseConfigured) {
      const trips = getLocalTrips();
      return trips.find((t) => t.id === tripId) || null;
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError(`buscar viagem ${tripId}`, error);
    }

    return data;
  },

  /**
   * Mantido para retrocompatibilidade: busca a viagem ativa principal
   */
  async getTrip(): Promise<Trip | null> {
    const activeTrips = await this.getTrips({ includeArchived: false });
    return activeTrips.length > 0 ? activeTrips[0] : null;
  },

  /**
   * Cria uma nova viagem
   */
  async createTrip(payload: Partial<Trip>): Promise<Trip> {
    if (!payload.title?.trim()) throw new Error('O nome da viagem é obrigatório.');
    if (!payload.destination?.trim()) throw new Error('O destino é obrigatório.');

    const newTrip: Trip = {
      id: payload.id || crypto.randomUUID(),
      title: payload.title.trim(),
      destination: payload.destination.trim(),
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      country: payload.country?.trim() || null,
      start_date: payload.start_date || null as unknown as string,
      end_date: payload.end_date || null as unknown as string,
      cover_image_url: payload.cover_image_url?.trim() || null,
      description: payload.description?.trim() || null,
      estimated_budget_per_person: payload.estimated_budget_per_person ?? null,
      is_archived: false,
      archived_at: null,
      created_by: payload.created_by || 'admin-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Modo demo (sem Supabase): salva no localStorage sem inventar dados
    if (!isSupabaseConfigured) {
      const trips = getLocalTrips();
      saveLocalTrips([newTrip, ...trips]);
      return newTrip;
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        id: newTrip.id,
        title: newTrip.title,
        destination: newTrip.destination,
        city: newTrip.city,
        state: newTrip.state,
        country: newTrip.country,
        start_date: newTrip.start_date,
        end_date: newTrip.end_date,
        cover_image_url: newTrip.cover_image_url,
        description: newTrip.description,
        estimated_budget_per_person: newTrip.estimated_budget_per_person,
        is_archived: false,
        created_by: newTrip.created_by,
      })
      .select()
      .single();

    if (error) {
      throw formatSupabaseError('criar viagem', error);
    }

    return data;
  },

  /**
   * Atualiza dados de uma viagem
   */
  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    if (!isSupabaseConfigured) {
      const trips = getLocalTrips();
      const updated = trips.map((t) => (t.id === tripId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      saveLocalTrips(updated);
      return;
    }

    const { error } = await supabase
      .from('trips')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (error) {
      throw formatSupabaseError(`atualizar viagem ${tripId}`, error);
    }
  },

  /**
   * Arquiva uma viagem (retira das ativas sem excluir dados)
   */
  async archiveTrip(tripId: string): Promise<void> {
    return this.updateTrip(tripId, {
      is_archived: true,
      archived_at: new Date().toISOString(),
    });
  },

  /**
   * Restaura uma viagem arquivada para a lista ativa
   */
  async restoreTrip(tripId: string): Promise<void> {
    return this.updateTrip(tripId, {
      is_archived: false,
      archived_at: null,
    });
  },

  /**
   * Exclui definitivamente uma viagem (com cascade)
   */
  async deleteTrip(tripId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const trips = getLocalTrips();
      const updated = trips.filter((t) => t.id !== tripId);
      saveLocalTrips(updated);
      return;
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('Erro ao excluir viagem:', error);
      throw error;
    }
  },
};
