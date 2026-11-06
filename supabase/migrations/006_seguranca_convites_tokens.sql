-- ============================================================
-- ROTA DE VERÃO — Migração 006: Segurança Rigorosa dos Convites com Hashing SHA-256
-- Armazena SOMENTE o hash do token no banco de dados.
-- Elimina a exigência de PIN e corrige o tratamento de casais sem quebra de FK.
--
-- NOTA: Esta migração está 100% incorporada no CONSOLIDATED_SETUP.sql.
-- Se você executou o CONSOLIDATED_SETUP.sql, NÃO precisa executar este arquivo.
-- Este arquivo existe apenas como referência incremental.
-- ============================================================

-- 1. ADAPTAÇÃO DA TABELA INVITATIONS PARA ARMAZENAR APENAS HASH SHA-256
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS token_hash TEXT;

ALTER TABLE public.invitations
  ALTER COLUMN profile_id DROP NOT NULL,
  ALTER COLUMN pin_hash DROP NOT NULL;

-- Tratamento de coluna legada "token" em texto puro (migração 001)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invitations'
      AND column_name = 'token'
  ) THEN
    ALTER TABLE public.invitations ALTER COLUMN token DROP NOT NULL;
    ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_token_key;
    UPDATE public.invitations SET token = NULL;
  END IF;
END $$;

-- Revoga convites legados antigos sem token_hash para que não fiquem como convites zumbis
UPDATE public.invitations
SET is_revoked = true
WHERE token_hash IS NULL;

-- Garante constraint UNIQUE em token_hash tratando possíveis duplicatas com segurança sem apagar dados
DO $$ BEGIN
  UPDATE public.invitations i
  SET is_revoked = true,
      token_hash = i.token_hash || '_dup_' || i.id::text
  WHERE i.id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY token_hash ORDER BY created_at DESC) as rn
      FROM public.invitations
      WHERE token_hash IS NOT NULL
    ) sub
    WHERE sub.rn > 1
  );

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.invitations'::regclass
      AND contype = 'u'
      AND conname LIKE '%token_hash%'
  ) THEN
    BEGIN
      ALTER TABLE public.invitations ADD CONSTRAINT invitations_token_hash_unique UNIQUE (token_hash);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_trip_token_hash_active ON public.invitations(trip_id, token_hash) WHERE is_revoked = false;

-- 2. AJUSTE DE CASAIS (PERMITE PARCEIRO SEM CONTA PRÉVIA)
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS partner_name VARCHAR(100);
ALTER TABLE public.couples
  ALTER COLUMN member_b_id DROP NOT NULL;

-- 3. FUNÇÃO PARA OBTER CONVITE ATIVO OU GERAR NOVO (apenas administradora)
-- Se já existe convite ativo e não expirado, retorna metadados SEM o token.
-- Se NÃO existe, cria um novo e retorna o token em texto puro SOMENTE neste momento.
-- Abrir a tela de participantes NÃO invalida links existentes.
CREATE OR REPLACE FUNCTION public.get_or_create_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_existing RECORD;
  v_raw_token TEXT;
  v_token_hash TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode visualizar ou gerar links de convite.';
  END IF;

  -- Verifica se já existe convite ativo e não expirado
  SELECT id, expires_at INTO v_existing
  FROM public.invitations
  WHERE trip_id = p_trip_id
    AND profile_id IS NULL
    AND token_hash IS NOT NULL
    AND is_revoked = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se já existe, retorna metadados SEM o token
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'token', NULL,
      'expires_at', v_existing.expires_at,
      'is_new', false
    );
  END IF;

  -- Não existe convite ativo: gera um novo token
  v_raw_token := encode(gen_random_bytes(24), 'hex');
  v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

  INSERT INTO public.invitations (
    trip_id, profile_id, pin_hash, token_hash, expires_at, is_revoked
  ) VALUES (
    p_trip_id, NULL, NULL, v_token_hash, now() + INTERVAL '90 days', false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_raw_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'is_new', true
  );
END;
$$;

-- 4. FUNÇÃO PARA REGENERAR LINK DE CONVITE (revoga anterior e gera novo)
CREATE OR REPLACE FUNCTION public.regenerate_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_raw_token TEXT;
  v_token_hash TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode regenerar o link de convite.';
  END IF;

  -- Revoga todos os convites ativos anteriores
  UPDATE public.invitations
  SET is_revoked = true
  WHERE trip_id = p_trip_id AND profile_id IS NULL AND is_revoked = false;

  v_raw_token := encode(gen_random_bytes(24), 'hex');
  v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

  INSERT INTO public.invitations (
    trip_id, profile_id, pin_hash, token_hash, expires_at, is_revoked
  ) VALUES (
    p_trip_id, NULL, NULL, v_token_hash, now() + INTERVAL '90 days', false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_raw_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'message', 'Novo link gerado com sucesso. O link anterior foi revogado.'
  );
END;
$$;

-- 5. FUNÇÃO PARA REVOGAR LINK DE CONVITE
CREATE OR REPLACE FUNCTION public.revoke_trip_invite(p_trip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
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

-- 6. ACEITAR CONVITE: VALIDAÇÃO POR HASH SHA-256 E FIXAÇÃO ESTRITA DE 'MEMBER'
CREATE OR REPLACE FUNCTION public.accept_trip_invitation(
  p_trip_id UUID,
  p_token TEXT,
  p_is_couple BOOLEAN DEFAULT false,
  p_partner_name VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_name TEXT;
  v_trip_exists BOOLEAN;
  v_presented_hash TEXT;
  v_invite_record RECORD;
  v_existing_member_id UUID;
  v_member_id UUID;
  v_couple_id UUID := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado. Faça login ou crie uma conta para aceitar o convite.';
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'Token de convite inválido ou ausente. O acesso a viagens privadas exige um link oficial com código de autorização.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id AND is_archived = false
  ) INTO v_trip_exists;

  IF NOT v_trip_exists THEN
    RAISE EXCEPTION 'A viagem informada não existe ou foi arquivada.';
  END IF;

  v_presented_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  SELECT id, expires_at, is_revoked INTO v_invite_record
  FROM public.invitations
  WHERE trip_id = p_trip_id 
    AND token_hash = v_presented_hash
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

  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;
  v_user_name := COALESCE(v_user_name, 'Participante');

  IF p_is_couple AND p_partner_name IS NOT NULL AND length(trim(p_partner_name)) >= 2 THEN
    v_couple_id := gen_random_uuid();
    INSERT INTO public.couples (id, trip_id, label, member_a_id, member_b_id, partner_name)
    VALUES (
      v_couple_id,
      p_trip_id,
      v_user_name || ' & ' || trim(p_partner_name),
      v_user_id,
      NULL,
      trim(p_partner_name)
    );
  END IF;

  v_member_id := gen_random_uuid();
  INSERT INTO public.trip_members (
    id, trip_id, profile_id, role, confirmation_status, couple_id, confirmed_at
  ) VALUES (
    v_member_id, p_trip_id, v_user_id, 'member', 'confirmed', v_couple_id, now()
  );

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

-- 7. BLINDAGEM DE TRIP_MEMBERS (proteção de role, profile_id, trip_id e couple_id)
-- Utiliza IS DISTINCT FROM para tratar corretamente comparações com NULL
CREATE OR REPLACE FUNCTION public.check_trip_member_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT public.is_trip_admin(OLD.trip_id) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Acesso negado: apenas a administradora pode alterar papéis de participantes.';
    END IF;
    IF NEW.profile_id IS DISTINCT FROM OLD.profile_id THEN
      RAISE EXCEPTION 'Acesso negado: não é permitido alterar o usuário desta participação.';
    END IF;
    IF NEW.trip_id IS DISTINCT FROM OLD.trip_id THEN
      RAISE EXCEPTION 'Acesso negado: não é permitido transferir o registro para outra viagem.';
    END IF;
    IF NEW.couple_id IS DISTINCT FROM OLD.couple_id THEN
      RAISE EXCEPTION 'Acesso negado: apenas a administradora pode alterar o vínculo de casal.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_trip_member_update ON public.trip_members;
CREATE TRIGGER trigger_protect_trip_member_update
  BEFORE UPDATE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.check_trip_member_update();

-- 8. PERMISSÕES DE EXECUÇÃO
REVOKE ALL ON FUNCTION public.get_or_create_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.regenerate_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) TO authenticated;

-- 9. LIMPEZA DE ASSINATURA OBSOLETA (migração 005 sem token)
DROP FUNCTION IF EXISTS public.accept_trip_invitation(UUID, BOOLEAN, VARCHAR);
DROP FUNCTION IF EXISTS public.accept_trip_invitation(UUID, BOOLEAN, TEXT);
