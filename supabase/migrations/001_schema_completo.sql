-- ============================================================
--  ROTA DE VERÃO — Script SQL Completo
--  Migration 001: Schema inicial, ENUMs, tabelas, índices e RLS
--  Executar no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PARTE 1: TIPOS ENUMERADOS (ENUMs)
-- ─────────────────────────────────────────────────────────────

-- Papel do participante na viagem
CREATE TYPE user_role AS ENUM ('admin', 'member');

-- Status de confirmação de presença
CREATE TYPE confirmation_status AS ENUM ('pending', 'confirmed', 'declined');

-- Status de pagamento de uma cota
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'verified');

-- Categoria de despesa
CREATE TYPE expense_category AS ENUM (
  'flight',
  'accommodation',
  'vehicle',
  'food',
  'tour',
  'other'
);

-- Critério de divisão da despesa
CREATE TYPE split_criterion AS ENUM (
  'individual',
  'equal_all_confirmed',
  'equal_custom',
  'vehicle_users'
);

-- Categoria de votação
CREATE TYPE poll_category AS ENUM (
  'accommodation',
  'vehicle',
  'tour',
  'restaurant',
  'general'
);

-- Tipo de notificação interna
CREATE TYPE notification_type AS ENUM (
  'poll_created',
  'trip_updated',
  'price_alert',
  'expense_added',
  'system'
);


-- ─────────────────────────────────────────────────────────────
-- PARTE 2: TABELAS
-- ─────────────────────────────────────────────────────────────

-- 2.1. PROFILES — perfis públicos dos participantes
-- Vinculado ao sistema de autenticação do Supabase (auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(100) NOT NULL,
  nickname    VARCHAR(50),
  phone       VARCHAR(20),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfis públicos dos participantes, ligados ao auth.users do Supabase.';


-- 2.2. TRIPS — dados da viagem
CREATE TABLE trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(120) NOT NULL,
  destination     VARCHAR(100) NOT NULL,
  state           VARCHAR(50),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  cover_image_url TEXT,
  description     TEXT,
  estimated_budget_per_person NUMERIC(10,2),
  created_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE trips IS 'Dados gerais da viagem. Apenas a administradora pode editar.';


-- 2.3. COUPLES — agrupamento de casais
CREATE TABLE couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  label       VARCHAR(80) NOT NULL,
  member_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT couples_members_different CHECK (member_a_id <> member_b_id),
  CONSTRAINT couples_unique_member_a   UNIQUE (trip_id, member_a_id),
  CONSTRAINT couples_unique_member_b   UNIQUE (trip_id, member_b_id)
);

COMMENT ON TABLE couples IS 'Agrupamento de dois participantes em casal para visualização consolidada.';


-- 2.4. TRIP_MEMBERS — participação de cada pessoa na viagem
CREATE TABLE trip_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                user_role NOT NULL DEFAULT 'member',
  confirmation_status confirmation_status NOT NULL DEFAULT 'pending',
  couple_id           UUID REFERENCES couples(id) ON DELETE SET NULL,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT trip_members_unique UNIQUE (trip_id, profile_id)
);

COMMENT ON TABLE trip_members IS 'Associa participantes à viagem com papel e status de confirmação.';


-- 2.5. INVITATIONS — convites individuais com PIN e link único
CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pin_hash     TEXT NOT NULL,       -- Hash bcrypt do PIN de 6 dígitos (nunca o PIN puro)
  token        TEXT NOT NULL UNIQUE, -- Token aleatório para link direto
  expires_at   TIMESTAMPTZ NOT NULL,
  is_revoked   BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT invitations_unique UNIQUE (trip_id, profile_id)
);

COMMENT ON TABLE invitations IS 'Convites individuais. O PIN nunca é armazenado em texto puro.';


-- 2.6. ACCOMMODATIONS — opções de hospedagem
CREATE TABLE accommodations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                 UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name                    VARCHAR(150) NOT NULL,
  address                 TEXT,
  photos                  TEXT[] NOT NULL DEFAULT '{}',
  bedrooms_count          INTEGER NOT NULL,
  total_capacity          INTEGER NOT NULL,
  total_amount            NUMERIC(10,2) NOT NULL,
  price_per_person_estimated NUMERIC(10,2),
  external_url            TEXT,
  notes                   TEXT,
  is_favorite             BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE accommodations IS 'Opções de hospedagem cadastradas pela administradora.';


-- 2.7. FLIGHTS — opções de passagens aéreas
CREATE TABLE flights (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  airline              VARCHAR(80) NOT NULL,
  origin_airport       VARCHAR(4) NOT NULL,
  origin_city          VARCHAR(80),
  destination_airport  VARCHAR(4) NOT NULL,
  destination_city     VARCHAR(80),
  departure_time       TIMESTAMPTZ NOT NULL,
  arrival_time         TIMESTAMPTZ NOT NULL,
  flight_number        VARCHAR(20),
  price                NUMERIC(10,2) NOT NULL,
  baggage_included     BOOLEAN NOT NULL DEFAULT false,
  purchase_url         TEXT,
  type                 VARCHAR(10) NOT NULL CHECK (type IN ('ida', 'volta')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE flights IS 'Opções de passagens cadastradas manualmente pela administradora.';


-- 2.8. VEHICLES — veículos disponíveis para aluguel
CREATE TABLE vehicles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id            UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  model              VARCHAR(100) NOT NULL,
  category           VARCHAR(50) NOT NULL,
  passenger_capacity INTEGER NOT NULL,
  luggage_capacity   INTEGER NOT NULL DEFAULT 0,
  daily_rate         NUMERIC(10,2) NOT NULL,
  total_days         INTEGER NOT NULL,
  total_amount       NUMERIC(10,2) NOT NULL,
  pickup_location    VARCHAR(100) NOT NULL,
  return_location    VARCHAR(100) NOT NULL,
  rental_company     VARCHAR(80),
  external_url       TEXT,
  image_url          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE vehicles IS 'Veículos disponíveis para aluguel durante a viagem.';


-- 2.9. VEHICLE_INTERESTS — manifestação de interesse em veículo
CREATE TABLE vehicle_interests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id     UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vehicle_interests_unique UNIQUE (vehicle_id, trip_member_id)
);

COMMENT ON TABLE vehicle_interests IS 'Registra quais participantes utilizarão cada veículo para fins de rateio.';


-- 2.10. POLLS — enquetes e votações
CREATE TABLE polls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title             VARCHAR(150) NOT NULL,
  description       TEXT,
  category          poll_category NOT NULL DEFAULT 'general',
  allows_change_vote BOOLEAN NOT NULL DEFAULT true,
  is_closed         BOOLEAN NOT NULL DEFAULT false,
  deadline          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE polls IS 'Votações democráticas criadas pela administradora.';


-- 2.11. POLL_OPTIONS — opções de cada votação
CREATE TABLE poll_options (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id          UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  title            VARCHAR(150) NOT NULL,
  description      TEXT,
  image_url        TEXT,
  external_link    TEXT,
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE SET NULL,
  vehicle_id       UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE poll_options IS 'Opções disponíveis para votação em cada enquete.';


-- 2.12. POLL_VOTES — votos registrados
CREATE TABLE poll_votes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id        UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  poll_option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT poll_votes_unique_per_member UNIQUE (poll_id, trip_member_id)
);

COMMENT ON TABLE poll_votes IS 'Votos dos participantes. Um voto por participante por enquete.';


-- 2.13. COST_ITEMS — despesas lançadas
CREATE TABLE cost_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title          VARCHAR(120) NOT NULL,
  category       expense_category NOT NULL DEFAULT 'other',
  total_amount   NUMERIC(10,2) NOT NULL,
  split_criterion split_criterion NOT NULL DEFAULT 'equal_all_confirmed',
  vehicle_id     UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  receipt_url    TEXT,
  notes          TEXT,
  due_date       DATE,
  created_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cost_items IS 'Despesas da viagem com critério de divisão.';


-- 2.14. COST_PARTICIPANTS — rateio individual por despesa
CREATE TABLE cost_participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_item_id   UUID NOT NULL REFERENCES cost_items(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  assigned_amount NUMERIC(10,2) NOT NULL,
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cost_participants_unique UNIQUE (cost_item_id, trip_member_id)
);

COMMENT ON TABLE cost_participants IS 'Quanto cada participante deve pagar em cada despesa.';


-- 2.15. ACTIVITY_LOGS — trilha de auditoria imutável
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action      VARCHAR(60) NOT NULL,  -- Ex: 'confirmed_presence', 'cast_vote'
  entity_name VARCHAR(60),           -- Ex: 'trip_members', 'poll_votes'
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_logs IS 'Log imutável de auditoria. Nunca deve ser alterado ou excluído.';


-- ─────────────────────────────────────────────────────────────
-- PARTE 3: ÍNDICES DE PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_trip_members_trip_id    ON trip_members(trip_id);
CREATE INDEX idx_trip_members_profile_id ON trip_members(profile_id);
CREATE INDEX idx_couples_trip_id         ON couples(trip_id);
CREATE INDEX idx_invitations_token       ON invitations(token);
CREATE INDEX idx_invitations_trip_profile ON invitations(trip_id, profile_id);
CREATE INDEX idx_poll_votes_poll_member  ON poll_votes(poll_id, trip_member_id);
CREATE INDEX idx_cost_participants_member ON cost_participants(trip_member_id);
CREATE INDEX idx_cost_items_trip         ON cost_items(trip_id);
CREATE INDEX idx_activity_logs_trip      ON activity_logs(trip_id, created_at DESC);
CREATE INDEX idx_flights_trip_id         ON flights(trip_id);
CREATE INDEX idx_vehicles_trip_id        ON vehicles(trip_id);
CREATE INDEX idx_accommodations_trip_id  ON accommodations(trip_id);


-- ─────────────────────────────────────────────────────────────
-- PARTE 4: VIEW — status consolidado dos casais
-- Calculado no banco, não no JavaScript
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW couple_status_view AS
SELECT
  c.id              AS couple_id,
  c.trip_id,
  c.label,
  c.member_a_id,
  c.member_b_id,
  pa.full_name      AS member_a_name,
  pb.full_name      AS member_b_name,
  pa.nickname       AS member_a_nickname,
  pb.nickname       AS member_b_nickname,
  pa.avatar_url     AS member_a_avatar,
  pb.avatar_url     AS member_b_avatar,
  tma.confirmation_status AS member_a_status,
  tmb.confirmation_status AS member_b_status,
  CASE
    WHEN tma.confirmation_status = 'confirmed' AND tmb.confirmation_status = 'confirmed'
      THEN 'confirmed'
    WHEN tma.confirmation_status = 'declined' AND tmb.confirmation_status = 'declined'
      THEN 'declined'
    WHEN tma.confirmation_status = 'confirmed' OR tmb.confirmation_status = 'confirmed'
      THEN 'partial'
    ELSE 'pending'
  END AS couple_status
FROM couples c
JOIN profiles pa ON pa.id = c.member_a_id
JOIN profiles pb ON pb.id = c.member_b_id
JOIN trip_members tma ON tma.trip_id = c.trip_id AND tma.profile_id = c.member_a_id
JOIN trip_members tmb ON tmb.trip_id = c.trip_id AND tmb.profile_id = c.member_b_id;

COMMENT ON VIEW couple_status_view IS 'Status consolidado dos casais calculado no banco. Nunca no frontend.';


-- ─────────────────────────────────────────────────────────────
-- PARTE 5: FUNÇÃO AUXILIAR — atualizar updated_at automaticamente
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at nas tabelas que possuem o campo
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_poll_votes_updated_at
  BEFORE UPDATE ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────────────
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- A segurança real está aqui — não no JavaScript
-- ─────────────────────────────────────────────────────────────

-- Função auxiliar: verifica se o usuário logado é admin de uma viagem
CREATE OR REPLACE FUNCTION is_trip_admin(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar: verifica se o usuário logado é membro de uma viagem
CREATE OR REPLACE FUNCTION is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 6.1. PROFILES ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT TO authenticated
  USING (true); -- Qualquer autenticado pode ver perfis (necessário para exibir nomes)

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Inserção feita pela Edge Function (service_role), não diretamente
-- Sem política de INSERT para 'authenticated' é intencional


-- ── 6.2. TRIPS ─────────────────────────────────────────────────
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_member"
  ON trips FOR SELECT TO authenticated
  USING (is_trip_member(id));

CREATE POLICY "trips_update_admin"
  ON trips FOR UPDATE TO authenticated
  USING (is_trip_admin(id))
  WITH CHECK (is_trip_admin(id));

-- Criação de viagem: feita via seed/admin diretamente, não pelo frontend no MVP


-- ── 6.3. TRIP_MEMBERS ──────────────────────────────────────────
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_members_select"
  ON trip_members FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "trip_members_update_own_status"
  ON trip_members FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    -- Participante não pode se auto-promover para admin
    AND role = (SELECT role FROM trip_members WHERE profile_id = auth.uid() AND trip_id = trip_members.trip_id)
  );

CREATE POLICY "trip_members_all_admin"
  ON trip_members FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.4. COUPLES ───────────────────────────────────────────────
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couples_select_member"
  ON couples FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "couples_all_admin"
  ON couples FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.5. INVITATIONS ───────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Participante pode ver apenas seu próprio convite (para saber se está ativo)
CREATE POLICY "invitations_select_own"
  ON invitations FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Administradora vê e gerencia todos os convites da viagem
CREATE POLICY "invitations_all_admin"
  ON invitations FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));

-- Validação do PIN: feita via Edge Function com service_role (nunca direto pelo frontend)


-- ── 6.6. ACCOMMODATIONS ────────────────────────────────────────
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accommodations_select_member"
  ON accommodations FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "accommodations_all_admin"
  ON accommodations FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.7. FLIGHTS ───────────────────────────────────────────────
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flights_select_member"
  ON flights FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "flights_all_admin"
  ON flights FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.8. VEHICLES ──────────────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_member"
  ON vehicles FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "vehicles_all_admin"
  ON vehicles FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.9. VEHICLE_INTERESTS ─────────────────────────────────────
ALTER TABLE vehicle_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_interests_select_member"
  ON vehicle_interests FOR SELECT TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM trip_members
      WHERE trip_id = (SELECT trip_id FROM vehicles WHERE id = vehicle_id)
        AND profile_id = auth.uid()
    )
    OR is_trip_admin((SELECT trip_id FROM vehicles WHERE id = vehicle_interests.vehicle_id))
  );

-- Participante confirmado pode registrar/remover seu próprio interesse
CREATE POLICY "vehicle_interests_insert_confirmed"
  ON vehicle_interests FOR INSERT TO authenticated
  WITH CHECK (
    trip_member_id IN (
      SELECT id FROM trip_members
      WHERE profile_id = auth.uid()
        AND confirmation_status = 'confirmed'
    )
  );

CREATE POLICY "vehicle_interests_delete_own"
  ON vehicle_interests FOR DELETE TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM trip_members WHERE profile_id = auth.uid()
    )
  );


-- ── 6.10. POLLS ────────────────────────────────────────────────
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_select_member"
  ON polls FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "polls_all_admin"
  ON polls FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.11. POLL_OPTIONS ─────────────────────────────────────────
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_options_select_member"
  ON poll_options FOR SELECT TO authenticated
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE is_trip_member(trip_id)
    )
  );

CREATE POLICY "poll_options_all_admin"
  ON poll_options FOR ALL TO authenticated
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE is_trip_admin(trip_id)
    )
  );


-- ── 6.12. POLL_VOTES ───────────────────────────────────────────
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Todos os membros veem todos os votos da viagem (para percentuais)
CREATE POLICY "poll_votes_select_member"
  ON poll_votes FOR SELECT TO authenticated
  USING (
    poll_id IN (
      SELECT p.id FROM polls p WHERE is_trip_member(p.trip_id)
    )
  );

-- Participante confirmado registra seu próprio voto
CREATE POLICY "poll_votes_insert_own_confirmed"
  ON poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    trip_member_id IN (
      SELECT id FROM trip_members
      WHERE profile_id = auth.uid()
        AND confirmation_status = 'confirmed'
    )
  );

-- Participante altera seu voto somente se a enquete permitir
CREATE POLICY "poll_votes_update_own_if_allowed"
  ON poll_votes FOR UPDATE TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM trip_members WHERE profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE id = poll_votes.poll_id
        AND is_closed = false
        AND allows_change_vote = true
        AND (deadline IS NULL OR deadline > now())
    )
  );


-- ── 6.13. COST_ITEMS ───────────────────────────────────────────
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_items_select_member"
  ON cost_items FOR SELECT TO authenticated
  USING (is_trip_member(trip_id));

CREATE POLICY "cost_items_all_admin"
  ON cost_items FOR ALL TO authenticated
  USING (is_trip_admin(trip_id))
  WITH CHECK (is_trip_admin(trip_id));


-- ── 6.14. COST_PARTICIPANTS ────────────────────────────────────
ALTER TABLE cost_participants ENABLE ROW LEVEL SECURITY;

-- Participante vê apenas suas próprias cotas; admin vê tudo
CREATE POLICY "cost_participants_select"
  ON cost_participants FOR SELECT TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM trip_members WHERE profile_id = auth.uid()
    )
    OR is_trip_admin((
      SELECT trip_id FROM cost_items WHERE id = cost_participants.cost_item_id
    ))
  );

CREATE POLICY "cost_participants_all_admin"
  ON cost_participants FOR ALL TO authenticated
  USING (
    is_trip_admin((
      SELECT trip_id FROM cost_items WHERE id = cost_participants.cost_item_id
    ))
  );


-- ── 6.15. ACTIVITY_LOGS — apenas INSERT, nunca UPDATE/DELETE ──
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Administradora vê todos os logs da viagem
CREATE POLICY "activity_logs_select_admin"
  ON activity_logs FOR SELECT TO authenticated
  USING (is_trip_admin(trip_id));

-- Qualquer membro pode inserir seu próprio log de ação
CREATE POLICY "activity_logs_insert_member"
  ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND is_trip_member(trip_id)
  );

-- NÃO existem políticas de UPDATE ou DELETE — log é imutável por design


-- ─────────────────────────────────────────────────────────────
-- PARTE 7: GATILHO AUTOMÁTICO DE PERFIL
-- Cria perfil automaticamente quando um novo usuário é criado no Auth
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Participante'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS
  'Cria automaticamente o perfil público na tabela profiles quando um usuário é registrado no Auth.';

