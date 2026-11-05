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

interface AppRoutesProps {
  currentRole: 'admin' | 'member';
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ currentRole }) => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard currentRole={currentRole} />} />
      <Route path="/participantes" element={<Participants />} />
      <Route path="/hospedagem" element={<Accommodations />} />
      <Route path="/passagens" element={<Flights />} />
      <Route path="/veiculos" element={<Vehicles />} />
      <Route path="/enquetes" element={<Polls currentRole={currentRole} />} />
      <Route path="/financeiro" element={<Expenses />} />
      <Route path="/administracao" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

