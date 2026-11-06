import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { Sidebar } from './components/layout/Sidebar';
import { AppRoutes } from './routes/AppRoutes';

const AppLayout: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === '/entrar';
  const isJoinPage = location.pathname.startsWith('/convite/');

  // Se estiver na tela de login ou na página de convite público, renderiza tela cheia
  if (isLoginPage || isJoinPage) {
    return <AppRoutes currentRole={role} />;
  }

  return (
    <div className="min-h-screen flex bg-tropical-bg text-tropical-text">
      {/* Sidebar lateral fixa */}
      <Sidebar currentRole={role} />

      {/* Área de conteúdo principal — deslocada à direita no desktop */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Banner informativo e acesso rápido ao perfil */}
        <DisclaimerBanner currentRole={role} />

        {/* Conteúdo das páginas */}
        <main className="flex-1">
          <AppRoutes currentRole={role} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripProvider>
          <AppLayout />
        </TripProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
