-- ============================================================
--  ROTA DE VERÃO — Seed de Dados Iniciais
--  Executar APÓS o script 001_schema_completo.sql
--
--  INSTRUÇÕES:
--  1. Substitua SEU_USER_ID pelo UUID do seu usuário no Supabase
--     (encontrado em Authentication → Users → copie o User UID)
--  2. Execute no SQL Editor do Supabase
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PASSO 1: Atualizar o perfil da Administradora
-- (O trigger já criou o perfil automaticamente ao se registrar)
-- Substitua SEU_USER_ID pelo seu UUID real
-- ─────────────────────────────────────────────────────────────
UPDATE profiles
SET
  full_name  = 'Julia (Organizadora)',
  nickname   = 'Julia',
  phone      = '',
  avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
WHERE id = 'SEU_USER_ID';


-- ─────────────────────────────────────────────────────────────
-- PASSO 2: Criar a viagem
-- ─────────────────────────────────────────────────────────────
INSERT INTO trips (
  id,
  title,
  destination,
  state,
  start_date,
  end_date,
  cover_image_url,
  description,
  estimated_budget_per_person,
  created_by
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- ID fixo para facilitar referências
  'Rota de Verão 2027',
  'Fortaleza & Cumbuco',
  'Ceará',
  '2027-01-15',
  '2027-01-22',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1920&q=80',
  'Uma semana inesquecível de praia, descanso e passeios de buggy pelo litoral cearense com os melhores amigos.',
  2850.00,
  'SEU_USER_ID'  -- Substitua pelo seu UUID real
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 3: Adicionar a Administradora como membro da viagem
-- ─────────────────────────────────────────────────────────────
INSERT INTO trip_members (
  trip_id,
  profile_id,
  role,
  confirmation_status,
  confirmed_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SEU_USER_ID',  -- Substitua pelo seu UUID real
  'admin',
  'confirmed',
  now()
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 4: Hospedagens de exemplo
-- ─────────────────────────────────────────────────────────────
INSERT INTO accommodations (trip_id, name, address, photos, bedrooms_count, total_capacity, total_amount, price_per_person_estimated, external_url, notes, is_favorite) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Villa Beira-Mar Cumbuco (Opção Favorita)',
  'Praia do Cumbuco, Caucaia - CE',
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80'
  ],
  5, 12, 9800.00, 980.00,
  'https://airbnb.com',
  'Piscina privativa, Pé na areia, Ar-condicionado em todos os quartos, Wi-Fi fibra, Churrasqueira gourmet, Estacionamento para 3 carros',
  true
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Casa dos Coqueiros com Vista para as Dunas',
  'Loteamento Tabuba, Cumbuco - CE',
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
  ],
  4, 10, 8200.00, 820.00,
  'https://booking.com',
  'Piscina, Área verde ampla, Vista para o pôr do sol, Cozinha equipada',
  false
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Pousada Boutique Sol & Vento (Suítes Privativas)',
  'Centro, Cumbuco - CE',
  ARRAY[
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
  ],
  6, 14, 11200.00, 1120.00,
  'https://booking.com',
  'Café da manhã incluso, Piscina com bar, Limpeza diária, A 200m da praia',
  false
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 5: Passagens de exemplo
-- ─────────────────────────────────────────────────────────────
INSERT INTO flights (trip_id, airline, origin_airport, origin_city, destination_airport, destination_city, departure_time, arrival_time, flight_number, price, baggage_included, purchase_url, type) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOL Linhas Aéreas', 'GRU', 'São Paulo', 'FOR', 'Fortaleza',
  '2027-01-15 07:45:00-03', '2027-01-15 11:15:00-03',
  'G3 1542', 890.00, false, 'https://voegol.com.br', 'ida'
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'LATAM Airlines', 'GRU', 'São Paulo', 'FOR', 'Fortaleza',
  '2027-01-15 09:20:00-03', '2027-01-15 12:55:00-03',
  'LA 3380', 940.00, true, 'https://latamairlines.com', 'ida'
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOL Linhas Aéreas', 'FOR', 'Fortaleza', 'GRU', 'São Paulo',
  '2027-01-22 17:30:00-03', '2027-01-22 21:05:00-03',
  'G3 1549', 910.00, false, 'https://voegol.com.br', 'volta'
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'LATAM Airlines', 'FOR', 'Fortaleza', 'GRU', 'São Paulo',
  '2027-01-22 19:10:00-03', '2027-01-22 22:45:00-03',
  'LA 3385', 980.00, true, 'https://latamairlines.com', 'volta'
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 6: Veículos de exemplo
-- ─────────────────────────────────────────────────────────────
INSERT INTO vehicles (trip_id, model, category, passenger_capacity, luggage_capacity, daily_rate, total_days, total_amount, pickup_location, return_location, rental_company, image_url) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Jeep Renegade Turbo (ou similar)', 'SUV Compacto',
  5, 3, 185.00, 7, 1295.00,
  'Aeroporto Pinto Martins (FOR)', 'Aeroporto Pinto Martins (FOR)',
  'Localiza',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Chevrolet Spin 7 Lugares', 'Minivan Familiar',
  7, 4, 230.00, 7, 1610.00,
  'Aeroporto Pinto Martins (FOR)', 'Aeroporto Pinto Martins (FOR)',
  'Movida',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 7: Enquetes de exemplo
-- ─────────────────────────────────────────────────────────────
INSERT INTO polls (id, trip_id, title, description, category, allows_change_vote, is_closed, deadline) VALUES
(
  'poll-aaa1-bbbb-cccc-dddd00000001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Qual opção de hospedagem vocês preferem?',
  'Votação oficial para fechar a reserva da casa em Cumbuco com os valores já acordados.',
  'accommodation', true, false,
  '2026-11-20 23:59:00-03'
),
(
  'poll-aaa1-bbbb-cccc-dddd00000002',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Qual passeio bate-volta devemos incluir na programação?',
  'Escolha um dia para conhecermos uma praia vizinha de buggy ou van.',
  'tour', true, false,
  '2026-11-28 18:00:00-03'
);

INSERT INTO poll_options (poll_id, title, description) VALUES
(
  'poll-aaa1-bbbb-cccc-dddd00000001',
  'Villa Beira-Mar Cumbuco (Pé na areia)',
  'R$ 980 por pessoa com piscina exclusiva e 5 suítes.'
),
(
  'poll-aaa1-bbbb-cccc-dddd00000001',
  'Casa dos Coqueiros (Dunas)',
  'R$ 820 por pessoa, ampla área verde.'
),
(
  'poll-aaa1-bbbb-cccc-dddd00000002',
  'Passeio pelas Falésias de Morro Branco',
  'Labirinto das falésias coloridas e Praia das Fontes.'
),
(
  'poll-aaa1-bbbb-cccc-dddd00000002',
  'Bate-volta em Canoa Quebrada',
  'Praia paradisíaca famosa pela Broadway e dunas.'
),
(
  'poll-aaa1-bbbb-cccc-dddd00000002',
  'Lagoinha e Lagoa das Almécegas',
  'Passeio de catamarã e pau de arara.'
);


-- ─────────────────────────────────────────────────────────────
-- PASSO 8: Log inicial de auditoria
-- ─────────────────────────────────────────────────────────────
INSERT INTO activity_logs (trip_id, actor_id, action, entity_name, details)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SEU_USER_ID',  -- Substitua pelo seu UUID real
  'created_trip',
  'trips',
  '{"title": "Rota de Verão 2027", "destination": "Fortaleza & Cumbuco - CE"}'::jsonb
);

