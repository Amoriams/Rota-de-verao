-- ============================================================
--  ROTA DE VERÃO — Migração 002: Suporte a Múltiplas Viagens
--  - Adição de cidade, país, arquivamento e restauração de viagens
--  - Gatilho automático de vinculação da criadora como administradora
--  - Políticas RLS completas para criação, edição, arquivamento e exclusão
-- ============================================================

-- 1. ADIÇÃO DE CAMPOS ESTATÍSTICOS E CONTROLE DE ARQUIVAMENTO
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.trips.city IS 'Cidade de destino da viagem.';
COMMENT ON COLUMN public.trips.country IS 'País de destino da viagem (padrão Brasil).';
COMMENT ON COLUMN public.trips.is_archived IS 'Flag que indica se a viagem foi arquivada pela administradora.';
COMMENT ON COLUMN public.trips.archived_at IS 'Data/hora em que a viagem foi arquivada.';

-- 2. ÍNDICES DE PERFORMANCE PARA ISOLAMENTO E LISTAGEM
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON public.trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_is_archived ON public.trips(is_archived);

-- 3. ATUALIZAÇÃO DA FUNÇÃO is_trip_admin PARA RECONHECER O CRIADOR
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
  ) OR EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = p_trip_id
      AND created_by = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_trip_admin(UUID) IS
  'Verifica se o usuário atual é administradora ou criador da viagem indicada.';

-- 4. GATILHO AUTOMÁTICO: CRIADOR DA VIAGEM SE TORNA ADMIN NO TRIP_MEMBERS
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

COMMENT ON FUNCTION public.handle_new_trip() IS
  'Vincula automaticamente a criadora como administradora confirmada da nova viagem.';

-- 5. POLÍTICAS RLS ATUALIZADAS PARA TRIPS (CRIAR, LER, EDITAR, EXCLUIR)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select_member" ON public.trips;
DROP POLICY IF EXISTS "trips_update_admin" ON public.trips;
DROP POLICY IF EXISTS "trips_select" ON public.trips;
DROP POLICY IF EXISTS "trips_insert" ON public.trips;
DROP POLICY IF EXISTS "trips_update" ON public.trips;
DROP POLICY IF EXISTS "trips_delete" ON public.trips;

-- Leitura: criador ou participantes vinculados
CREATE POLICY "trips_select"
  ON public.trips FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_trip_member(id));

-- Criação: qualquer usuário autenticado pode criar uma nova viagem
CREATE POLICY "trips_insert"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Edição / Arquivamento: apenas a administradora da viagem
CREATE POLICY "trips_update"
  ON public.trips FOR UPDATE TO authenticated
  USING (public.is_trip_admin(id))
  WITH CHECK (public.is_trip_admin(id));

-- Exclusão definitiva: apenas a administradora da viagem
CREATE POLICY "trips_delete"
  ON public.trips FOR DELETE TO authenticated
  USING (public.is_trip_admin(id));

