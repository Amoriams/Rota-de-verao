import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, TripMember, UserRole } from '../@types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  member: TripMember | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithPin: (pin: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  // Alternador para modo demo quando offline ou sem chaves configuradas
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [member, setMember] = useState<TripMember | null>(null);
  const [demoRole, setDemoRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(true);

  // Carrega perfil e vínculo de viagem do usuário
  const fetchUserData = async (userId: string) => {
    try {
      // 1. Perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // 2. Vínculo de membro na viagem
      const { data: memberData } = await supabase
        .from('trip_members')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do perfil/membro:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Inicializa sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    // Ouve mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setMember(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    return { error: error ? new Error(error.message) : null };
  };

  // Login simplificado por PIN
  const loginWithPin = async (pin: string) => {
    setIsLoading(true);
    try {
      // Caso a Edge Function `verify-pin` esteja configurada
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: { pin },
      });

      if (error) throw error;
      if (data?.hashed_token) {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          token_hash: data.hashed_token,
          type: 'magiclink',
        });
        if (otpErr) throw otpErr;
        return { error: null };
      }
      if (data?.session) {
        await supabase.auth.setSession(data.session);
        return { error: null };
      }
      return { error: new Error('Não foi possível validar o código PIN.') };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na validação do PIN.';
      return { error: new Error(message) };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setMember(null);
  };

  const currentRole: UserRole = isSupabaseConfigured
    ? (member?.role ?? (user ? 'member' : demoRole))
    : demoRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        member,
        role: currentRole,
        isAuthenticated: isSupabaseConfigured ? Boolean(user) : true,
        isLoading,
        isConfigured: isSupabaseConfigured,
        loginWithEmail,
        loginWithPin,
        logout,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

