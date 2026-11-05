import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { Sidebar } from './components/layout/Sidebar';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'admin' | 'member'>('admin');

  const handleToggleRole = () => {
    setCurrentRole(prev => (prev === 'admin' ? 'member' : 'admin'));
  };

  return (
    <BrowserRouter>
      {/* Layout raiz: sidebar fixa à esquerda + conteúdo à direita */}
      <div className="min-h-screen flex bg-slate-50 text-slate-800">

        {/* Sidebar lateral fixa */}
        <Sidebar currentRole={currentRole} />

        {/* Área de conteúdo principal — deslocada à direita da sidebar no desktop */}
        <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

          {/* Banner informativo do Marco 2 e alternador de perfil */}
          <DisclaimerBanner
            currentRole={currentRole}
            onToggleRole={handleToggleRole}
          />

          {/* Conteúdo das páginas */}
          <main className="flex-1">
            <AppRoutes currentRole={currentRole} />
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;


