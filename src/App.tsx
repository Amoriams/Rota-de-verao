import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'admin' | 'member'>('admin');

  const handleToggleRole = () => {
    setCurrentRole(prev => (prev === 'admin' ? 'member' : 'admin'));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-coastal-offwhite text-slate-800">
        
        {/* Banner Informativo do Marco 2 e Alternador de Perfil */}
        <DisclaimerBanner 
          currentRole={currentRole} 
          onToggleRole={handleToggleRole} 
        />

        {/* Barra de Navegação Superior */}
        <Navbar currentRole={currentRole} />

        {/* Área de Conteúdo Central */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 w-full">
          <AppRoutes currentRole={currentRole} />
        </main>

        {/* Rodapé da Aplicação */}
        <Footer />

      </div>
    </BrowserRouter>
  );
};

export default App;
