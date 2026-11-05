-- ============================================================
--  ROTA DE VERÃO — Script SQL Completo (Revisão Rigorosa de Segurança)
--  Migration 001: Schema inicial, ENUMs, tabelas, índices, triggers e RLS
--  Executar no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

-- Habilita extensão pgcrypto para bcrypt nativo
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ─────────────────────────────────────────────────────────────
-- PARTE 1: TIPOS ENUMERADOS (ENUMs)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE public.user_role AS ENUM ('admin', 'member');

CREATE TYPE public.confirmation_status AS ENUM ('pending', 'confirmed', 'declined');

CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'verified');

CREATE TYPE public.expense_category AS ENUM (
  'flight',
  'accommodation',
  'vehicle',
  'food',
  'tour',
  'other'
);

CREATE TYPE public.split_criterion AS ENUM (
  'individual',
  'equal_all_confirmed',
  'equal_custom',
  'vehicle_users'
);

CREATE TYPE public.poll_category AS ENUM (
  'accommodation',
  'vehicle',
  'tour',
  'restaurant',
  'general'
);

CREATE TYPE public.notification_type AS ENUM (
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
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(100) NOT NULL,
  nickname    VARCHAR(50),
  phone       VARCHAR(20),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfis públicos dos participantes, ligados ao auth.users do Supabase.';


-- 2.2. TRIPS — dados da viagem
CREATE TABLE public.trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(120) NOT NULL,
  destination     VARCHAR(100) NOT NULL,
  state           VARCHAR(50),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  cover_image_url TEXT,
  description     TEXT,
  estimated_budget_per_person NUMERIC(10,2),
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trips IS 'Dados gerais da viagem. Apenas a administradora pode editar.';


-- 2.3. COUPLES — agrupamento de casais
CREATE TABLE public.couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label       VARCHAR(80) NOT NULL,
  member_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT couples_members_different CHECK (member_a_id <> member_b_id),
  CONSTRAINT couples_unique_member_a   UNIQUE (trip_id, member_a_id),
  CONSTRAINT couples_unique_member_b   UNIQUE (trip_id, member_b_id)
);

COMMENT ON TABLE public.couples IS 'Agrupamento de dois participantes em casal para visualização consolidada.';


-- 2.4. TRIP_MEMBERS — participação de cada pessoa na viagem
CREATE TABLE public.trip_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role                public.user_role NOT NULL DEFAULT 'member',
  confirmation_status public.confirmation_status NOT NULL DEFAULT 'pending',
  couple_id           UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT trip_members_unique UNIQUE (trip_id, profile_id)
);

COMMENT ON TABLE public.trip_members IS 'Associa participantes à viagem com papel e status de confirmação.';


-- 2.5. INVITATIONS — convites individuais com hash bcrypt, salt individual e rate-limit
CREATE TABLE public.invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash        TEXT NOT NULL,          -- Hash bcrypt ($2a$10$...) com salt individual aleatório
  token           TEXT NOT NULL UNIQUE,   -- Token aleatório criptograficamente forte para link direto
  expires_at      TIMESTAMPTZ NOT NULL,
  is_revoked      BOOLEAN NOT NULL DEFAULT false,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  blocked_until   TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT invitations_unique UNIQUE (trip_id, profile_id)
);

COMMENT ON TABLE public.invitations IS 'Convites com hash bcrypt de alta lentidão computacional e controle individual de tentativas.';


-- 2.6. AUTH_RATE_LIMITS — proteção anti-força bruta por IP e identificador
CREATE TABLE public.auth_rate_limits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    VARCHAR(45) NOT NULL,
  identifier    VARCHAR(100) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  blocked_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT auth_rate_limits_unique UNIQUE (ip_address, identifier)
);

COMMENT ON TABLE public.auth_rate_limits IS 'Registro atômico de tentativas de autenticação para bloqueio temporário.';


-- 2.7. ACCOMMODATIONS — opções de hospedagem
CREATE TABLE public.accommodations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                 UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.accommodations IS 'Opções de hospedagem cadastradas pela administradora.';


-- 2.8. FLIGHTS — opções de passagens aéreas
CREATE TABLE public.flights (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.flights IS 'Opções de passagens cadastradas manualmente pela administradora.';


-- 2.9. VEHICLES — veículos disponíveis para aluguel
CREATE TABLE public.vehicles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id            UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.vehicles IS 'Veículos disponíveis para aluguel durante a viagem.';


-- 2.10. VEHICLE_INTERESTS — manifestação de interesse em veículo
CREATE TABLE public.vehicle_interests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id     UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vehicle_interests_unique UNIQUE (vehicle_id, trip_member_id)
);

COMMENT ON TABLE public.vehicle_interests IS 'Registra quais participantes utilizarão cada veículo para fins de rateio.';


-- 2.11. POLLS — enquetes e votações
CREATE TABLE public.polls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id           UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title             VARCHAR(150) NOT NULL,
  description       TEXT,
  category          public.poll_category NOT NULL DEFAULT 'general',
  allows_change_vote BOOLEAN NOT NULL DEFAULT true,
  is_closed         BOOLEAN NOT NULL DEFAULT false,
  deadline          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.polls IS 'Votações democráticas criadas pela administradora.';


-- 2.12. POLL_OPTIONS — opções de cada votação
CREATE TABLE public.poll_options (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id          UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  title            VARCHAR(150) NOT NULL,
  description      TEXT,
  image_url        TEXT,
  external_link    TEXT,
  accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE SET NULL,
  vehicle_id       UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.poll_options IS 'Opções disponíveis para votação em cada enquete.';


-- 2.13. POLL_VOTES — votos registrados
CREATE TABLE public.poll_votes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id        UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  poll_option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT poll_votes_unique_per_member UNIQUE (poll_id, trip_member_id)
);

COMMENT ON TABLE public.poll_votes IS 'Votos dos participantes. Um voto por participante por enquete.';


-- 2.14. COST_ITEMS — despesas lançadas
CREATE TABLE public.cost_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title          VARCHAR(120) NOT NULL,
  category       public.expense_category NOT NULL DEFAULT 'other',
  total_amount   NUMERIC(10,2) NOT NULL,
  split_criterion public.split_criterion NOT NULL DEFAULT 'equal_all_confirmed',
  vehicle_id     UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  receipt_url    TEXT,
  notes          TEXT,
  due_date       DATE,
  created_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cost_items IS 'Despesas da viagem com critério de divisão.';


-- 2.15. COST_PARTICIPANTS — rateio individual por despesa
CREATE TABLE public.cost_participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_item_id   UUID NOT NULL REFERENCES public.cost_items(id) ON DELETE CASCADE,
  trip_member_id UUID NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  assigned_amount NUMERIC(10,2) NOT NULL,
  payment_status  public.payment_status NOT NULL DEFAULT 'pending',
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cost_participants_unique UNIQUE (cost_item_id, trip_member_id)
);

COMMENT ON TABLE public.cost_participants IS 'Quanto cada participante deve pagar em cada despesa.';


-- 2.16. ACTIVITY_LOGS — trilha de auditoria imutável
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action      VARCHAR(60) NOT NULL,
  entity_name VARCHAR(60),
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.activity_logs IS 'Log imutável de auditoria. Nunca deve ser alterado ou excluído.';


-- ─────────────────────────────────────────────────────────────
-- PARTE 3: ÍNDICES DE PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_trip_members_trip_id      ON public.trip_members(trip_id);
CREATE INDEX idx_trip_members_profile_id   ON public.trip_members(profile_id);
CREATE INDEX idx_couples_trip_id           ON public.couples(trip_id);
CREATE INDEX idx_invitations_token         ON public.invitations(token);
CREATE INDEX idx_invitations_trip_profile   ON public.invitations(trip_id, profile_id);
CREATE INDEX idx_auth_rate_limits_lookup   ON public.auth_rate_limits(ip_address, identifier);
CREATE INDEX idx_poll_votes_poll_member    ON public.poll_votes(poll_id, trip_member_id);
CREATE INDEX idx_cost_participants_member  ON public.cost_participants(trip_member_id);
CREATE INDEX idx_cost_items_trip           ON public.cost_items(trip_id);
CREATE INDEX idx_activity_logs_trip        ON public.activity_logs(trip_id, created_at DESC);
CREATE INDEX idx_flights_trip_id           ON public.flights(trip_id);
CREATE INDEX idx_vehicles_trip_id          ON public.vehicles(trip_id);
CREATE INDEX idx_accommodations_trip_id    ON public.accommodations(trip_id);


-- ─────────────────────────────────────────────────────────────
-- PARTE 4: VIEW — status consolidado dos casais (Resiliente a Exclusão)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.couple_status_view AS
SELECT
  c.id              AS couple_id,
  c.trip_id,
  c.label,
  c.member_a_id,
  c.member_b_id,
  COALESCE(pa.full_name, 'Participante Desvinculado') AS member_a_name,
  COALESCE(pb.full_name, 'Participante Desvinculado') AS member_b_name,
  pa.nickname       AS member_a_nickname,
  pb.nickname       AS member_b_nickname,
  pa.avatar_url     AS member_a_avatar,
  pb.avatar_url     AS member_b_avatar,
  COALESCE(tma.confirmation_status, 'declined') AS member_a_status,
  COALESCE(tmb.confirmation_status, 'declined') AS member_b_status,
  CASE
    WHEN tma.id IS NULL OR tmb.id IS NULL
      THEN 'declined'
    WHEN tma.confirmation_status = 'confirmed' AND tmb.confirmation_status = 'confirmed'
      THEN 'confirmed'
    WHEN tma.confirmation_status = 'declined' AND tmb.confirmation_status = 'declined'
      THEN 'declined'
    WHEN tma.confirmation_status = 'confirmed' OR tmb.confirmation_status = 'confirmed'
      THEN 'partial'
    ELSE 'pending'
  END AS couple_status
FROM public.couples c
LEFT JOIN public.profiles pa ON pa.id = c.member_a_id
LEFT JOIN public.profiles pb ON pb.id = c.member_b_id
LEFT JOIN public.trip_members tma ON tma.trip_id = c.trip_id AND tma.profile_id = c.member_a_id
LEFT JOIN public.trip_members tmb ON tmb.trip_id = c.trip_id AND tmb.profile_id = c.member_b_id;

COMMENT ON VIEW public.couple_status_view IS 'Status consolidado dos casais com LEFT JOIN para tolerar participantes desvinculados.';


-- ─────────────────────────────────────────────────────────────
-- PARTE 5: FUNÇÕES AUXILIARES COM SEARCH_PATH SEGURO
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers de updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_poll_votes_updated_at
  BEFORE UPDATE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_auth_rate_limits_updated_at
  BEFORE UPDATE ON public.auth_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Função auxiliar: verifica se o usuário logado é administradora
CREATE OR REPLACE FUNCTION public.is_trip_admin(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Função auxiliar: verifica se o usuário logado é membro da viagem
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- PARTE 6: AUDITORIA AUTOMÁTICA VIA TRIGGERS NO BANCO (AMPLIADA)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trip_id UUID;
  v_actor_id UUID;
  v_action VARCHAR(60);
  v_details JSONB;
BEGIN
  v_actor_id := auth.uid();

  -- Extrai o trip_id correto dependendo da tabela
  IF TG_TABLE_NAME = 'trips' THEN
    v_trip_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME IN ('trip_members', 'cost_items', 'accommodations', 'flights', 'vehicles', 'polls', 'couples') THEN
    v_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);
  ELSE
    v_trip_id := NULL;
  END IF;

  v_action := lower(TG_OP) || '_' || TG_TABLE_NAME;

  IF TG_OP = 'UPDATE' THEN
    v_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_details := jsonb_build_object('old', to_jsonb(OLD));
  ELSE
    v_details := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  -- Higieniza: remove eventuais campos de credenciais do log
  IF v_details ? 'pin_hash' THEN
    v_details := v_details - 'pin_hash';
  END IF;
  IF v_details ? 'token' THEN
    v_details := v_details - 'token';
  END IF;

  -- Registra apenas se houver viagem e autor identificado
  IF v_trip_id IS NOT NULL AND v_actor_id IS NOT NULL THEN
    INSERT INTO public.activity_logs (
      trip_id,
      actor_id,
      action,
      entity_name,
      entity_id,
      details,
      created_at
    ) VALUES (
      v_trip_id,
      v_actor_id,
      v_action,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      v_details,
      now()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers automáticos nas tabelas críticas
CREATE TRIGGER trigger_audit_trips
  AFTER UPDATE OR DELETE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_trip_members
  AFTER INSERT OR UPDATE OR DELETE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_accommodations
  AFTER INSERT OR UPDATE OR DELETE ON public.accommodations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_flights
  AFTER INSERT OR UPDATE OR DELETE ON public.flights
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_polls
  AFTER INSERT OR UPDATE OR DELETE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trigger_audit_cost_items
  AFTER INSERT OR UPDATE OR DELETE ON public.cost_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


-- ─────────────────────────────────────────────────────────────
-- PARTE 7: VALIDAÇÃO ATÔMICA DE PIN COM BCRYPT E ANTI-ENUMERAÇÃO
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.verify_invitation_pin(
  p_pin TEXT,
  p_token TEXT,
  p_ip TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_ip_record RECORD;
  v_invite RECORD;
  v_matched_invite RECORD := NULL;
  v_auth_email TEXT;
  v_dummy_bcrypt TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
BEGIN
  -- 1. Rate limiting atômico por IP
  SELECT * INTO v_ip_record
  FROM public.auth_rate_limits
  WHERE ip_address = p_ip AND identifier = 'ip-global'
  FOR UPDATE;

  IF FOUND THEN
    IF v_ip_record.blocked_until IS NOT NULL AND v_ip_record.blocked_until > v_now THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'BLOCKED_IP',
        'message', 'Muitas tentativas a partir deste endereço. Tente novamente mais tarde.'
      );
    END IF;
  ELSE
    INSERT INTO public.auth_rate_limits (ip_address, identifier, attempt_count)
    VALUES (p_ip, 'ip-global', 0)
    ON CONFLICT (ip_address, identifier) DO NOTHING;
  END IF;

  -- 2. Busca e validação do convite
  IF p_token IS NOT NULL AND p_token <> '' THEN
    SELECT * INTO v_invite
    FROM public.invitations
    WHERE token = p_token AND is_revoked = false AND expires_at > v_now
    FOR UPDATE;

    IF FOUND THEN
      v_matched_invite := v_invite;
    END IF;
  ELSE
    -- Busca por PIN
    FOR v_invite IN
      SELECT * FROM public.invitations
      WHERE is_revoked = false AND expires_at > v_now
      FOR UPDATE
    LOOP
      IF v_invite.blocked_until IS NOT NULL AND v_invite.blocked_until > v_now THEN
        CONTINUE;
      END IF;

      -- Comparação bcrypt em tempo seguro
      IF extensions.crypt(p_pin, v_invite.pin_hash) = v_invite.pin_hash THEN
        v_matched_invite := v_invite;
        EXIT;
      ELSE
        -- Incrementa tentativas falhas no convite
        UPDATE public.invitations
        SET attempt_count = attempt_count + 1,
            last_attempt_at = v_now,
            blocked_until = CASE WHEN attempt_count + 1 >= 5 THEN v_now + INTERVAL '15 minutes' ELSE NULL END
        WHERE id = v_invite.id;
      END IF;
    END LOOP;

    -- Executa crypt dummy se nenhum convite for encontrado para equalizar tempo de resposta (anti-enumeração)
    IF v_matched_invite IS NULL THEN
      PERFORM extensions.crypt(p_pin, v_dummy_bcrypt);
    END IF;
  END IF;

  -- 3. Se não encontrou correspondência
  IF v_matched_invite IS NULL THEN
    UPDATE public.auth_rate_limits
    SET attempt_count = attempt_count + 1,
        blocked_until = CASE WHEN attempt_count + 1 >= 10 THEN v_now + INTERVAL '15 minutes' ELSE NULL END,
        updated_at = v_now
    WHERE ip_address = p_ip AND identifier = 'ip-global';

    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_CREDENTIALS',
      'message', 'Código de acesso ou convite inválido ou expirado.'
    );
  END IF;

  -- 4. Sucesso: Zera contadores de falha
  UPDATE public.invitations
  SET attempt_count = 0,
      blocked_until = NULL,
      last_used_at = v_now
  WHERE id = v_matched_invite.id;

  UPDATE public.auth_rate_limits
  SET attempt_count = 0,
      blocked_until = NULL,
      updated_at = v_now
  WHERE ip_address = p_ip AND identifier = 'ip-global';

  -- Obtém o e-mail do participante em auth.users
  SELECT email INTO v_auth_email
  FROM auth.users
  WHERE id = v_matched_invite.profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_matched_invite.profile_id,
    'trip_id', v_matched_invite.trip_id,
    'email', v_auth_email
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- PARTE 8: ROW LEVEL SECURITY (RLS) RIGOROSO EM TODAS AS TABELAS
-- ─────────────────────────────────────────────────────────────

-- ── 8.1. PROFILES ──────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── 8.2. TRIPS ─────────────────────────────────────────────────
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_member"
  ON public.trips FOR SELECT TO authenticated
  USING (public.is_trip_member(id));

CREATE POLICY "trips_update_admin"
  ON public.trips FOR UPDATE TO authenticated
  USING (public.is_trip_admin(id))
  WITH CHECK (public.is_trip_admin(id));


-- ── 8.3. TRIP_MEMBERS ──────────────────────────────────────────
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_members_select"
  ON public.trip_members FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "trip_members_update_own_status"
  ON public.trip_members FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    -- Impede auto-promoção de papel ou alteração de viagem
    AND role = (SELECT role FROM public.trip_members WHERE profile_id = auth.uid() AND trip_id = public.trip_members.trip_id)
  );

CREATE POLICY "trip_members_all_admin"
  ON public.trip_members FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.4. COUPLES ───────────────────────────────────────────────
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couples_select_member"
  ON public.couples FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "couples_all_admin"
  ON public.couples FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.5. INVITATIONS ───────────────────────────────────────────
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Participantes não podem listar ou inspecionar convites (anti-enumeração e anti-leaks)
-- Apenas a administradora gerencia os convites
CREATE POLICY "invitations_all_admin"
  ON public.invitations FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.6. AUTH_RATE_LIMITS ──────────────────────────────────────
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Sem acesso direto para clientes authenticated; operado somente por verify_invitation_pin (SECURITY DEFINER)


-- ── 8.7. ACCOMMODATIONS ────────────────────────────────────────
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accommodations_select_member"
  ON public.accommodations FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "accommodations_all_admin"
  ON public.accommodations FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.8. FLIGHTS ───────────────────────────────────────────────
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flights_select_member"
  ON public.flights FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "flights_all_admin"
  ON public.flights FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.9. VEHICLES ──────────────────────────────────────────────
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_member"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "vehicles_all_admin"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.10. VEHICLE_INTERESTS ────────────────────────────────────
ALTER TABLE public.vehicle_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_interests_select_member"
  ON public.vehicle_interests FOR SELECT TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM public.trip_members
      WHERE trip_id = (SELECT trip_id FROM public.vehicles WHERE id = vehicle_id)
        AND profile_id = auth.uid()
    )
    OR public.is_trip_admin((SELECT trip_id FROM public.vehicles WHERE id = public.vehicle_interests.vehicle_id))
  );

CREATE POLICY "vehicle_interests_insert_confirmed"
  ON public.vehicle_interests FOR INSERT TO authenticated
  WITH CHECK (
    trip_member_id IN (
      SELECT id FROM public.trip_members
      WHERE profile_id = auth.uid()
        AND confirmation_status = 'confirmed'
    )
  );

CREATE POLICY "vehicle_interests_delete_own"
  ON public.vehicle_interests FOR DELETE TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM public.trip_members WHERE profile_id = auth.uid()
    )
  );


-- ── 8.11. POLLS ────────────────────────────────────────────────
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_select_member"
  ON public.polls FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "polls_all_admin"
  ON public.polls FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.12. POLL_OPTIONS ─────────────────────────────────────────
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_options_select_member"
  ON public.poll_options FOR SELECT TO authenticated
  USING (
    poll_id IN (
      SELECT id FROM public.polls WHERE public.is_trip_member(trip_id)
    )
  );

CREATE POLICY "poll_options_all_admin"
  ON public.poll_options FOR ALL TO authenticated
  USING (
    poll_id IN (
      SELECT id FROM public.polls WHERE public.is_trip_admin(trip_id)
    )
  );


-- ── 8.13. POLL_VOTES ───────────────────────────────────────────
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes_select_member"
  ON public.poll_votes FOR SELECT TO authenticated
  USING (
    poll_id IN (
      SELECT p.id FROM public.polls p WHERE public.is_trip_member(p.trip_id)
    )
  );

CREATE POLICY "poll_votes_insert_own_confirmed"
  ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    trip_member_id IN (
      SELECT id FROM public.trip_members
      WHERE profile_id = auth.uid()
        AND confirmation_status = 'confirmed'
    )
  );

CREATE POLICY "poll_votes_update_own_if_allowed"
  ON public.poll_votes FOR UPDATE TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM public.trip_members WHERE profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.polls
      WHERE id = public.poll_votes.poll_id
        AND is_closed = false
        AND allows_change_vote = true
        AND (deadline IS NULL OR deadline > now())
    )
  );


-- ── 8.14. COST_ITEMS ───────────────────────────────────────────
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_items_select_member"
  ON public.cost_items FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

CREATE POLICY "cost_items_all_admin"
  ON public.cost_items FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));


-- ── 8.15. COST_PARTICIPANTS ────────────────────────────────────
ALTER TABLE public.cost_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_participants_select"
  ON public.cost_participants FOR SELECT TO authenticated
  USING (
    trip_member_id IN (
      SELECT id FROM public.trip_members WHERE profile_id = auth.uid()
    )
    OR public.is_trip_admin((
      SELECT trip_id FROM public.cost_items WHERE id = public.cost_participants.cost_item_id
    ))
  );

CREATE POLICY "cost_participants_all_admin"
  ON public.cost_participants FOR ALL TO authenticated
  USING (
    public.is_trip_admin((
      SELECT trip_id FROM public.cost_items WHERE id = public.cost_participants.cost_item_id
    ))
  );


-- ── 8.16. ACTIVITY_LOGS — apenas INSERT, nunca UPDATE/DELETE ──
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_admin"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_trip_admin(trip_id));

CREATE POLICY "activity_logs_insert_member"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_trip_member(trip_id)
  );


-- ─────────────────────────────────────────────────────────────
-- PARTE 9: GATILHO AUTOMÁTICO DE PERFIL AO REGISTRAR NO AUTH
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Participante'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Cria automaticamente o perfil público na tabela profiles ao registrar novo usuário no Auth.';
