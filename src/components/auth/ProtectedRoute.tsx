import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Palmtree } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isConfigured, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center animate-bounce mb-4 shadow-sm">
          <Palmtree className="w-8 h-8" />
        </div>
        <p className="font-display font-medium text-sm text-slate-600">
          Carregando a viagem... 🌊
        </p>
      </div>
    );
  }

  // Se o Supabase estiver configurado e o usuário não estiver autenticado, vai para o login
  if (isConfigured && !isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  // Se requer papel de Administradora e o usuário não for admin
  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
