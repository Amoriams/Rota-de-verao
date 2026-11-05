import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Trip } from '../@types/database.types';
import { tripService } from '../services/tripService';
import { useAuth } from './AuthContext';

interface TripContextType {
  trips: Trip[];
  activeTrips: Trip[];
  archivedTrips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  selectTrip: (tripId: string) => void;
  createTrip: (data: Partial<Trip>) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  archiveTrip: (tripId: string) => Promise<void>;
  restoreTrip: (tripId: string) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  refreshTrips: () => Promise<void>;
}

const ACTIVE_TRIP_KEY = 'rota_de_verao_active_trip_id';

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_TRIP_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  const activeTrips = useMemo(() => trips.filter((t) => !t.is_archived), [trips]);
  const archivedTrips = useMemo(() => trips.filter((t) => Boolean(t.is_archived)), [trips]);

  const currentTrip = useMemo(() => {
    if (!currentTripId) {
      return activeTrips.length > 0 ? activeTrips[0] : null;
    }
    const found = trips.find((t) => t.id === currentTripId);
    if (found) return found;
    return activeTrips.length > 0 ? activeTrips[0] : null;
  }, [trips, currentTripId, activeTrips]);

  const refreshTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await tripService.getTrips({ includeArchived: true });
      setTrips(all);

      // Sincroniza trip ativo
      if (all.length > 0) {
        const stored = localStorage.getItem(ACTIVE_TRIP_KEY);
        const match = all.find((t) => t.id === stored && !t.is_archived);
        if (match) {
          setCurrentTripId(match.id);
        } else {
          const firstActive = all.find((t) => !t.is_archived);
          if (firstActive) {
            setCurrentTripId(firstActive.id);
            localStorage.setItem(ACTIVE_TRIP_KEY, firstActive.id);
          } else {
            setCurrentTripId(null);
            localStorage.removeItem(ACTIVE_TRIP_KEY);
          }
        }
      } else {
        setCurrentTripId(null);
        localStorage.removeItem(ACTIVE_TRIP_KEY);
      }
    } catch (err) {
      console.error('Falha ao carregar lista de viagens:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  const selectTrip = useCallback((tripId: string) => {
    const target = trips.find((t) => t.id === tripId);
    if (target) {
      setCurrentTripId(target.id);
      localStorage.setItem(ACTIVE_TRIP_KEY, target.id);
    }
  }, [trips]);

  const createTrip = useCallback(async (data: Partial<Trip>): Promise<Trip> => {
    const created = await tripService.createTrip({
      ...data,
      created_by: user?.id || 'admin-user',
    });
    await refreshTrips();
    setCurrentTripId(created.id);
    localStorage.setItem(ACTIVE_TRIP_KEY, created.id);
    return created;
  }, [refreshTrips, user?.id]);

  const updateTrip = useCallback(async (tripId: string, updates: Partial<Trip>): Promise<void> => {
    await tripService.updateTrip(tripId, updates);
    await refreshTrips();
  }, [refreshTrips]);

  const archiveTrip = useCallback(async (tripId: string): Promise<void> => {
    await tripService.archiveTrip(tripId);
    await refreshTrips();
  }, [refreshTrips]);

  const restoreTrip = useCallback(async (tripId: string): Promise<void> => {
    await tripService.restoreTrip(tripId);
    await refreshTrips();
  }, [refreshTrips]);

  const deleteTrip = useCallback(async (tripId: string): Promise<void> => {
    await tripService.deleteTrip(tripId);
    await refreshTrips();
  }, [refreshTrips]);

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrips,
        archivedTrips,
        currentTrip,
        isLoading,
        selectTrip,
        createTrip,
        updateTrip,
        archiveTrip,
        restoreTrip,
        deleteTrip,
        refreshTrips,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip deve ser utilizado dentro de um TripProvider');
  }
  return context;
};

