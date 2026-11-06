-- ============================================================
-- ROTA DE VERÃO — Migração 004: Catálogo de Passagens e Veículos
-- Adiciona status formal, novos campos de oferta, observações
-- e rastreamento de atualização de preços para flights e vehicles
-- ============================================================

-- 1. ENUM DE STATUS DA OPÇÃO DO CATÁLOGO
DO $$ BEGIN
  CREATE TYPE public.catalog_option_status AS ENUM (
    'in_analysis',  -- Em análise
    'favorite',     -- Favorita
    'chosen',       -- Escolhida pela turma
    'booked',       -- Efetivamente reservada/emitida
    'discarded'     -- Descartada
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ENRIQUECIMENTO DA TABELA DE PASSAGENS AÉREAS (FLIGHTS)
ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS status public.catalog_option_status NOT NULL DEFAULT 'in_analysis',
  ADD COLUMN IF NOT EXISTS connections_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS return_departure_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_arrival_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.flights.status IS 'Status da alternativa de passagem no planejamento.';
COMMENT ON COLUMN public.flights.connections_count IS 'Quantidade de conexões/escalas no trecho.';
COMMENT ON COLUMN public.flights.notes IS 'Observações e orientações adicionais da administradora.';
COMMENT ON COLUMN public.flights.price_updated_at IS 'Data/hora da última checagem/atualização do valor.';

-- 3. ENRIQUECIMENTO DA TABELA DE VEÍCULOS (VEHICLES)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS status public.catalog_option_status NOT NULL DEFAULT 'in_analysis',
  ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS conditions TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.vehicles.status IS 'Status da alternativa de veículo no planejamento.';
COMMENT ON COLUMN public.vehicles.security_deposit IS 'Valor do caução ou franquia exigido pela locadora.';
COMMENT ON COLUMN public.vehicles.conditions IS 'Condições relevantes (KM livre, condutor adicional, etc).';
COMMENT ON COLUMN public.vehicles.notes IS 'Observações e orientações da administradora.';
COMMENT ON COLUMN public.vehicles.price_updated_at IS 'Data/hora da última checagem/atualização do valor.';

-- 4. ÍNDICES DE PERFORMANCE PARA FILTRAGEM POR VIAGEM E STATUS
CREATE INDEX IF NOT EXISTS idx_flights_trip_status ON public.flights(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_trip_status ON public.vehicles(trip_id, status);

-- 5. REFORÇO DAS POLÍTICAS RLS (LEITURA PARA MEMBROS, CRUD PARA ADMINS)
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flights_select_member" ON public.flights;
DROP POLICY IF EXISTS "flights_all_admin" ON public.flights;
DROP POLICY IF EXISTS "vehicles_select_member" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_all_admin" ON public.vehicles;

-- Leitura de passagens: qualquer participante membro da viagem
CREATE POLICY "flights_select_member"
  ON public.flights FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

-- Gerenciamento de passagens: exclusivo da administradora da viagem
CREATE POLICY "flights_all_admin"
  ON public.flights FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));

-- Leitura de veículos: qualquer participante membro da viagem
CREATE POLICY "vehicles_select_member"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id));

-- Gerenciamento de veículos: exclusivo da administradora da viagem
CREATE POLICY "vehicles_all_admin"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.is_trip_admin(trip_id))
  WITH CHECK (public.is_trip_admin(trip_id));

