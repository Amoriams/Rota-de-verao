-- ============================================================
-- ROTA DE VERÃO — Script SQL Consolidado de Configuração Inicial
-- Arquivo: supabase/migrations/CONSOLIDATED_SETUP.sql
-- 
-- Este script reúne de forma idempotente e segura:
-- 1. Migration 001: Schema completo, ENUMs, tabelas e RLS
-- 2. Migration 002: Multi-viagens e trigger on_trip_created
-- 3. Migration 004: Catálogo de passagens e veículos com status
-- 4. Migration 006: Convites seguros com tokens criptográficos
--    (Elimina a exigência de PIN e fecha a brecha da migration 005)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PARTE 1: EXTENSÕES
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ─────────────────────────────────────────────────────────────
-- PARTE 2: TIPOS ENUMERADOS (Idempotentes)
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.confirmation_status AS ENUM ('pending', 'confirmed', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM (
    'flight', 'accommodation', 'vehicle', 'food', 'tour', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.split_criterion AS ENUM (
    'individual', 'equal_all_confirmed', 'equal_custom', 'vehicle_users'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.poll_category AS ENUM (
    'accommodation', 'vehicle', 'tour', 'restaurant', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'poll_created', 'trip_updated', 'price_alert', 'expense_added', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.catalog_item_status AS ENUM (
    'in_analysis', 'favorite', 'chosen', 'booked', 'discarded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.flight_type AS ENUM ('outbound', 'return');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vehicle_category AS ENUM ('hatch', 'sedan', 'suv', 'minivan', 'van');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- PARTE 3: TABELAS FUNDAMENTAIS
-- ─────────────────────────────────────────────────────────────

-- 3.1. PROFILES — perfis públicos dos usuários vinculados ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(100) NOT NULL,
  nickname    VARCHAR(50),
  phone       VARCHAR(20),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2. TRIPS — viagens criadas na plataforma
CREATE TABLE IF NOT EXISTS public.trips (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                       VARCHAR(100) NOT NULL,
  destination                 VARCHAR(100) NOT NULL,
  city                        VARCHAR(100),
  state                       VARCHAR(50),
  country                     VARCHAR(100) DEFAULT 'Brasil',
  start_date                  DATE,
  end_date                    DATE,
  cover_image_url             TEXT,
  description                 TEXT,
  estimated_budget_per_person NUMERIC(10, 2),
  is_archived                 BOOLEAN NOT NULL DEFAULT false,
  archived_at                 TIMESTAMPTZ,
  created_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante que colunas adicionadas em migrações posteriores existam mesmo se a tabela já existia
ALTER TABLE public.trips 
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trips_created_by ON public.trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_is_archived ON public.trips(is_archived);

-- 3.3. TRIP_MEMBERS — participantes e vínculo por viagem
CREATE TABLE IF NOT EXISTS public.trip_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role                public.user_role NOT NULL DEFAULT 'member',
  confirmation_status public.confirmation_status NOT NULL DEFAULT 'pending',
  couple_id           UUID,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT trip_members_unique UNIQUE (trip_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_profile ON public.trip_members(profile_id);

-- 3.4. COUPLES — agrupamento de casais
CREATE TABLE IF NOT EXISTS public.couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label       VARCHAR(100) NOT NULL,
  member_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT couples_members_different CHECK (member_a_id <> member_b_id)
);

CREATE INDEX IF NOT EXISTS idx_couples_trip ON public.couples(trip_id);

-- 3.5. INVITATIONS — convites seguros com tokens criptográficos
CREATE TABLE IF NOT EXISTS public.invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash        TEXT,
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  is_revoked      BOOLEAN NOT NULL DEFAULT false,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  blocked_until   TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_trip_token_active ON public.invitations(trip_id, token) WHERE is_revoked = false;

-- Garante compatibilidade caso a tabela já tenha sido criada com NOT NULL anteriormente
ALTER TABLE public.invitations
  ALTER COLUMN profile_id DROP NOT NULL,
  ALTER COLUMN pin_hash DROP NOT NULL;

-- 3.6. FLIGHTS — catálogo de opções de passagens aéreas
CREATE TABLE IF NOT EXISTS public.flights (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  status               public.catalog_item_status NOT NULL DEFAULT 'in_analysis',
  type                 public.flight_type NOT NULL DEFAULT 'outbound',
  airline              VARCHAR(100) NOT NULL,
  flight_number        VARCHAR(20),
  origin_airport       VARCHAR(3) NOT NULL,
  destination_airport  VARCHAR(3) NOT NULL,
  departure_datetime   TIMESTAMPTZ NOT NULL,
  arrival_datetime     TIMESTAMPTZ NOT NULL,
  stops_count          INTEGER NOT NULL DEFAULT 0,
  duration_minutes     INTEGER,
  price_per_person     NUMERIC(10, 2) NOT NULL,
  baggage_included     BOOLEAN NOT NULL DEFAULT false,
  purchase_url         TEXT,
  airline_booking_ref  VARCHAR(50),
  notes                TEXT,
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flights_trip ON public.flights(trip_id);

-- 3.7. VEHICLES — catálogo de opções de locação de veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id            UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  status             public.catalog_item_status NOT NULL DEFAULT 'in_analysis',
  category           public.vehicle_category NOT NULL DEFAULT 'sedan',
  model              VARCHAR(100) NOT NULL,
  company            VARCHAR(100) NOT NULL,
  capacity           INTEGER NOT NULL DEFAULT 5,
  pickup_location    VARCHAR(100),
  return_location    VARCHAR(100),
  pickup_datetime    TIMESTAMPTZ,
  return_datetime    TIMESTAMPTZ,
  daily_rate         NUMERIC(10, 2) NOT NULL,
  total_price        NUMERIC(10, 2) NOT NULL,
  deposit_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  insurance_included BOOLEAN NOT NULL DEFAULT false,
  external_url       TEXT,
  notes              TEXT,
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_trip ON public.vehicles(trip_id);

CREATE TABLE IF NOT EXISTS public.vehicle_interested_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_interest_unique UNIQUE (vehicle_id, profile_id)
);

-- 3.8. ACCOMMODATIONS, POLLS, EXPENSES E AUDITORIA
CREATE TABLE IF NOT EXISTS public.accommodations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title           VARCHAR(100) NOT NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'house',
  url             TEXT,
  address         VARCHAR(255),
  total_price     NUMERIC(10, 2) NOT NULL,
  max_guests      INTEGER NOT NULL,
  bedrooms        INTEGER NOT NULL DEFAULT 1,
  bathrooms       INTEGER NOT NULL DEFAULT 1,
  photo_url       TEXT,
  is_selected     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.polls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category        public.poll_category NOT NULL DEFAULT 'general',
  title           VARCHAR(150) NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  closes_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id         UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  title           VARCHAR(150) NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2),
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id         UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id       UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_unique UNIQUE (poll_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  payer_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category        public.expense_category NOT NULL,
  title           VARCHAR(150) NOT NULL,
  total_amount    NUMERIC(10, 2) NOT NULL,
  split_criterion public.split_criterion NOT NULL DEFAULT 'individual',
  receipt_url     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id      UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_amount    NUMERIC(10, 2) NOT NULL,
  payment_status  public.payment_status NOT NULL DEFAULT 'pending',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT expense_splits_unique UNIQUE (expense_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          VARCHAR(100) NOT NULL,
  entity_name     VARCHAR(50) NOT NULL,
  entity_id       UUID,
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- PARTE 4: VIEWS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.couple_status_view AS
SELECT
  c.id          AS couple_id,
  c.trip_id     AS trip_id,
  c.label       AS label,
  c.member_a_id AS member_a_id,
  c.member_b_id AS member_b_id,
  pa.full_name  AS member_a_name,
  pb.full_name  AS member_b_name,
  pa.nickname   AS member_a_nickname,
  pb.nickname   AS member_b_nickname,
  pa.avatar_url AS member_a_avatar,
  pb.avatar_url AS member_b_avatar,
  tma.confirmation_status AS member_a_status,
  tmb.confirmation_status AS member_b_status,
  CASE
    WHEN tma.confirmation_status = 'confirmed' AND tmb.confirmation_status = 'confirmed' THEN 'confirmed'
    WHEN tma.confirmation_status = 'declined'  AND tmb.confirmation_status = 'declined'  THEN 'declined'
    WHEN tma.confirmation_status = 'confirmed'  OR tmb.confirmation_status = 'confirmed' THEN 'partial'
    ELSE 'pending'
  END AS couple_status
FROM public.couples c
JOIN public.profiles pa ON pa.id = c.member_a_id
JOIN public.profiles pb ON pb.id = c.member_b_id
JOIN public.trip_members tma ON tma.trip_id = c.trip_id AND tma.profile_id = c.member_a_id
JOIN public.trip_members tmb ON tmb.trip_id = c.trip_id AND tmb.profile_id = c.member_b_id;

-- ─────────────────────────────────────────────────────────────
-- PARTE 5: FUNÇÕES DE AUTORIZAÇÃO E GATILHOS AUTOMÁTICOS
-- ─────────────────────────────────────────────────────────────

-- 5.1. is_trip_member: verifica se o usuário é participante
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
  );
$$;

-- 5.2. is_trip_admin: verifica se o usuário é administrador ou criador
CREATE OR REPLACE FUNCTION public.is_trip_admin(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND profile_id = auth.uid()
      AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = p_trip_id
      AND created_by = auth.uid()
  );
$$;

-- 5.3. handle_new_user: cria perfil ao registrar conta no Supabase Auth
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Participante'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill automático: garante que usuários criados no Auth antes desta migração tenham perfil
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Participante'),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5.4. handle_new_trip: vincula automaticamente a criadora como administradora
CREATE OR REPLACE FUNCTION public.handle_new_trip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.trip_members (
    trip_id,
    profile_id,
    role,
    confirmation_status,
    confirmed_at
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    'confirmed',
    now()
  )
  ON CONFLICT (trip_id, profile_id) DO UPDATE
  SET role = 'admin', confirmation_status = 'confirmed';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trip_created ON public.trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_trip();

-- ─────────────────────────────────────────────────────────────
-- PARTE 6: CONVITES SEGUROS COM TOKENS (RPCs)
-- ─────────────────────────────────────────────────────────────

-- 6.1. Obter ou gerar convite ativo para a viagem (apenas administradora)
CREATE OR REPLACE FUNCTION public.get_or_create_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_invite_record RECORD;
  v_new_token TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode visualizar ou gerar links de convite.';
  END IF;

  SELECT id, token, expires_at INTO v_invite_record
  FROM public.invitations
  WHERE trip_id = p_trip_id
    AND profile_id IS NULL
    AND is_revoked = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite_record.token IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'token', v_invite_record.token,
      'expires_at', v_invite_record.expires_at,
      'is_new', false
    );
  END IF;

  v_new_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.invitations (
    trip_id, profile_id, pin_hash, token, expires_at, is_revoked
  ) VALUES (
    p_trip_id, NULL, NULL, v_new_token, now() + INTERVAL '90 days', false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'is_new', true
  );
END;
$$;

-- 6.2. Regenerar convite (revoga anterior e gera novo token)
CREATE OR REPLACE FUNCTION public.regenerate_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_new_token TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode regenerar o link de convite.';
  END IF;

  UPDATE public.invitations
  SET is_revoked = true
  WHERE trip_id = p_trip_id AND profile_id IS NULL AND is_revoked = false;

  v_new_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.invitations (
    trip_id, profile_id, pin_hash, token, expires_at, is_revoked
  ) VALUES (
    p_trip_id, NULL, NULL, v_new_token, now() + INTERVAL '90 days', false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'message', 'Novo link gerado com sucesso. O link anterior foi revogado.'
  );
END;
$$;

-- 6.3. Revogar convite (desativar convites por link)
CREATE OR REPLACE FUNCTION public.revoke_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode revogar convites.';
  END IF;

  UPDATE public.invitations
  SET is_revoked = true
  WHERE trip_id = p_trip_id AND profile_id IS NULL AND is_revoked = false;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Os convites por link foram revogados com sucesso.'
  );
END;
$$;

-- 6.4. Aceitar convite exigindo TOKEN VÁLIDO e conta autenticada
CREATE OR REPLACE FUNCTION public.accept_trip_invitation(
  p_trip_id UUID,
  p_token TEXT,
  p_is_couple BOOLEAN DEFAULT false,
  p_partner_name VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_name TEXT;
  v_trip_exists BOOLEAN;
  v_invite_record RECORD;
  v_existing_member_id UUID;
  v_member_id UUID;
  v_couple_id UUID := NULL;
  v_partner_user_id UUID;
  v_partner_member_id UUID;
BEGIN
  -- 1. Exige autenticação
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado. Faça login ou crie uma conta para aceitar o convite.';
  END IF;

  -- 2. Exige token obrigatório (UUID sozinho nunca concede acesso)
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'Token de convite inválido ou ausente. O acesso a viagens privadas exige um link oficial com código de autorização.';
  END IF;

  -- 3. Valida se a viagem existe e não está arquivada
  SELECT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id AND is_archived = false
  ) INTO v_trip_exists;

  IF NOT v_trip_exists THEN
    RAISE EXCEPTION 'A viagem informada não existe ou foi arquivada.';
  END IF;

  -- 4. Valida legitimidade do token no banco
  SELECT id, expires_at, is_revoked INTO v_invite_record
  FROM public.invitations
  WHERE trip_id = p_trip_id 
    AND token = trim(p_token)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite_record.id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido para esta viagem.';
  END IF;

  IF v_invite_record.is_revoked THEN
    RAISE EXCEPTION 'Este link de convite foi revogado pela administradora.';
  END IF;

  IF v_invite_record.expires_at IS NOT NULL AND v_invite_record.expires_at < now() THEN
    RAISE EXCEPTION 'Este link de convite expirou.';
  END IF;

  -- 5. Se já participa, retorna sucesso sem duplicar
  SELECT id INTO v_existing_member_id
  FROM public.trip_members
  WHERE trip_id = p_trip_id AND profile_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'member_id', v_existing_member_id,
      'message', 'Você já participa desta viagem.'
    );
  END IF;

  -- 6. Obtém nome do perfil
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;
  v_user_name := COALESCE(v_user_name, 'Participante');

  -- 7. Tratamento de casal (opcional)
  IF p_is_couple AND p_partner_name IS NOT NULL AND length(trim(p_partner_name)) >= 2 THEN
    v_partner_user_id := gen_random_uuid();
    v_couple_id := gen_random_uuid();

    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      v_partner_user_id,
      trim(p_partner_name),
      'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(trim(p_partner_name)::bytea, 'hex')
    );

    INSERT INTO public.couples (id, trip_id, label, member_a_id, member_b_id)
    VALUES (
      v_couple_id,
      p_trip_id,
      v_user_name || ' & ' || trim(p_partner_name),
      v_user_id,
      v_partner_user_id
    );

    v_partner_member_id := gen_random_uuid();
    INSERT INTO public.trip_members (
      id, trip_id, profile_id, role, confirmation_status, couple_id
    ) VALUES (
      v_partner_member_id, p_trip_id, v_partner_user_id, 'member', 'pending', v_couple_id
    );
  END IF;

  -- 8. Insere o participante autenticado como 'member' confirmado
  v_member_id := gen_random_uuid();
  INSERT INTO public.trip_members (
    id, trip_id, profile_id, role, confirmation_status, couple_id, confirmed_at
  ) VALUES (
    v_member_id, p_trip_id, v_user_id, 'member', 'confirmed', v_couple_id, now()
  );

  -- 9. Incrementa métricas do convite
  UPDATE public.invitations
  SET last_used_at = now(),
      attempt_count = attempt_count + 1
  WHERE id = v_invite_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_member', false,
    'member_id', v_member_id,
    'profile_id', v_user_id,
    'trip_id', p_trip_id
  );
END;
$$;

-- Permissões estritas nas RPCs
REVOKE ALL ON FUNCTION public.get_or_create_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.regenerate_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- PARTE 7: POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ─────────────────────────────────────────────────────────────

-- 7.1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 7.2. TRIPS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select"
  ON public.trips FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_trip_member(id));

DROP POLICY IF EXISTS "trips_insert" ON public.trips;
CREATE POLICY "trips_insert"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "trips_update" ON public.trips;
CREATE POLICY "trips_update"
  ON public.trips FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_trip_admin(id));

DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_delete"
  ON public.trips FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- 7.3. TRIP_MEMBERS
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_members_select" ON public.trip_members;
CREATE POLICY "trip_members_select"
  ON public.trip_members FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "trip_members_insert_admin" ON public.trip_members;
CREATE POLICY "trip_members_insert_admin"
  ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "trip_members_update_admin" ON public.trip_members;
CREATE POLICY "trip_members_update_admin"
  ON public.trip_members FOR UPDATE TO authenticated
  USING (public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "trip_members_update_own_status" ON public.trip_members;
CREATE POLICY "trip_members_update_own_status"
  ON public.trip_members FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "trip_members_delete_admin" ON public.trip_members;
CREATE POLICY "trip_members_delete_admin"
  ON public.trip_members FOR DELETE TO authenticated
  USING (public.is_trip_admin(trip_id));

-- 7.4. COUPLES
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couples_select" ON public.couples;
CREATE POLICY "couples_select"
  ON public.couples FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "couples_manage_admin" ON public.couples;
CREATE POLICY "couples_manage_admin"
  ON public.couples FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

-- 7.5. INVITATIONS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
CREATE POLICY "invitations_admin_all"
  ON public.invitations FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

-- 7.6. FLIGHTS
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flights_select_members" ON public.flights;
CREATE POLICY "flights_select_members"
  ON public.flights FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "flights_all_admin" ON public.flights;
CREATE POLICY "flights_all_admin"
  ON public.flights FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

-- 7.7. VEHICLES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_members" ON public.vehicles;
CREATE POLICY "vehicles_select_members"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));

DROP POLICY IF EXISTS "vehicles_all_admin" ON public.vehicles;
CREATE POLICY "vehicles_all_admin"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

ALTER TABLE public.vehicle_interested_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_interest_select" ON public.vehicle_interested_members;
CREATE POLICY "vehicle_interest_select"
  ON public.vehicle_interested_members FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "vehicle_interest_manage" ON public.vehicle_interested_members;
CREATE POLICY "vehicle_interest_manage"
  ON public.vehicle_interested_members FOR ALL TO authenticated
  USING (profile_id = auth.uid());

-- 7.8. ACCOMMODATIONS, POLLS, EXPENSES
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accommodations_select" ON public.accommodations;
CREATE POLICY "accommodations_select" ON public.accommodations FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));
DROP POLICY IF EXISTS "accommodations_admin" ON public.accommodations;
CREATE POLICY "accommodations_admin" ON public.accommodations FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "polls_select" ON public.polls;
CREATE POLICY "polls_select" ON public.polls FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));
DROP POLICY IF EXISTS "polls_admin" ON public.polls;
CREATE POLICY "polls_admin" ON public.polls FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id));

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "poll_options_select" ON public.poll_options;
CREATE POLICY "poll_options_select" ON public.poll_options FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "poll_options_admin" ON public.poll_options;
CREATE POLICY "poll_options_admin" ON public.poll_options FOR ALL TO authenticated
  USING (true);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;
CREATE POLICY "poll_votes_select" ON public.poll_votes FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
CREATE POLICY "poll_votes_insert" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "poll_votes_delete" ON public.poll_votes;
CREATE POLICY "poll_votes_delete" ON public.poll_votes FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));
DROP POLICY IF EXISTS "expenses_admin" ON public.expenses;
CREATE POLICY "expenses_admin" ON public.expenses FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id) OR payer_id = auth.uid());

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_splits_select" ON public.expense_splits;
CREATE POLICY "expense_splits_select" ON public.expense_splits FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "expense_splits_update_status" ON public.expense_splits;
CREATE POLICY "expense_splits_update_status" ON public.expense_splits FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id) OR public.is_trip_admin(trip_id));

-- Recarrega o cache do PostgREST imediatamente
NOTIFY pgrst, 'reload schema';

