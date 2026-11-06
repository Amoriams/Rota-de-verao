import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrip } from '../../contexts/TripContext';
import { Palmtree } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, role: authRole } = useAuth();
  const { isCurrentTripAdmin, currentTrip } = useTrip();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-tropical-bg text-tropical-text">
        <div className="w-14 h-14 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center animate-bounce mb-4 shadow-sm">
          <Palmtree className="w-8 h-8" />
        </div>
        <p className="font-display font-medium text-sm text-tropical-text-muted">
          Carregando a Rota de Verão... 🌊
        </p>
      </div>
    );
  }

  // Redireciona para o login caso o usuário não esteja autenticado
  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  // Se a rota requer papel de Administradora, verifica permissão na viagem ativa
  if (requireAdmin) {
    const hasAdminAccess = currentTrip ? isCurrentTripAdmin : authRole === 'admin';
    if (!hasAdminAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
