import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Dashboard } from '../pages/Dashboard';
import { Participants } from '../pages/Participants';
import { Accommodations } from '../pages/Accommodations';
import { Flights } from '../pages/Flights';
import { Vehicles } from '../pages/Vehicles';
import { Polls } from '../pages/Polls';
import { Expenses } from '../pages/Expenses';
import { Admin } from '../pages/Admin';
import { Login } from '../pages/Login';
import { MyTrips } from '../pages/MyTrips';
import { JoinTrip } from '../pages/JoinTrip';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

interface AppRoutesProps {
  currentRole: 'admin' | 'member';
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ currentRole }) => {
  return (
    <Routes>
      {/* Rota pública de login com PIN / e-mail */}
      <Route path="/entrar" element={<Login />} />

      {/* Rota pública de entrada por link compartilhável da viagem */}
      <Route path="/convite/:tripId" element={<JoinTrip />} />

      {/* Rotas protegidas acessíveis a membros e administradores */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard currentRole={currentRole} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/participantes"
        element={
          <ProtectedRoute>
            <Participants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospedagem"
        element={
          <ProtectedRoute>
            <Accommodations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/passagens"
        element={
          <ProtectedRoute>
            <Flights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/veiculos"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enquetes"
        element={
          <ProtectedRoute>
            <Polls currentRole={currentRole} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />

      {/* Rota exclusiva da Administradora */}
      <Route
        path="/minhas-viagens"
        element={
          <ProtectedRoute requireAdmin>
            <MyTrips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administracao"
        element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
