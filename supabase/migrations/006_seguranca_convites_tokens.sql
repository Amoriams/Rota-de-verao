-- ============================================================
-- ROTA DE VERÃO — Migração 006: Segurança Rigorosa dos Convites com Tokens
-- Reutiliza a tabela public.invitations para gerenciar links seguros.
-- Bloqueia entrada arbitrária por mero UUID e implementa revogação/regeneração.
-- ============================================================

-- 1. ADAPTAÇÃO DA TABELA INVITATIONS PARA SUPORTAR LINKS COMPARTILHÁVEIS
-- Torna profile_id e pin_hash opcionais para permitir convites gerais da viagem
ALTER TABLE public.invitations
  ALTER COLUMN profile_id DROP NOT NULL,
  ALTER COLUMN pin_hash DROP NOT NULL;

-- Índice para busca instantânea de tokens ativos por viagem
CREATE INDEX IF NOT EXISTS idx_invitations_trip_token_active
  ON public.invitations(trip_id, token)
  WHERE is_revoked = false;

-- 2. FUNÇÃO PARA ADMINISTRADORA OBTER OU GERAR LINK ATIVO DE CONVITE
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

  -- Valida se o usuário é administrador da viagem
  v_is_admin := public.is_trip_admin(p_trip_id);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas a administradora desta viagem pode visualizar ou gerar links de convite.';
  END IF;

  -- Busca convite ativo não revogado e não expirado
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

  -- Se não existir convite ativo, gera um novo token criptográfico forte
  v_new_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.invitations (
    trip_id,
    profile_id,
    pin_hash,
    token,
    expires_at,
    is_revoked
  ) VALUES (
    p_trip_id,
    NULL,
    NULL,
    v_new_token,
    now() + INTERVAL '90 days',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'is_new', true
  );
END;
$$;

-- 3. FUNÇÃO PARA REGENERAR LINK DE CONVITE (REVOGA O ANTERIOR E GERA NOVO)
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

  -- Revoga todos os convites gerais anteriores da viagem
  UPDATE public.invitations
  SET is_revoked = true
  WHERE trip_id = p_trip_id
    AND profile_id IS NULL
    AND is_revoked = false;

  -- Gera o novo token
  v_new_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.invitations (
    trip_id,
    profile_id,
    pin_hash,
    token,
    expires_at,
    is_revoked
  ) VALUES (
    p_trip_id,
    NULL,
    NULL,
    v_new_token,
    now() + INTERVAL '90 days',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'expires_at', (now() + INTERVAL '90 days'),
    'message', 'Novo link gerado com sucesso. O link anterior foi revogado.'
  );
END;
$$;

-- 4. FUNÇÃO PARA REVOGAR LINK DE CONVITE (DESATIVAR CONVITES)
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
  WHERE trip_id = p_trip_id
    AND profile_id IS NULL
    AND is_revoked = false;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Os convites por link foram revogados com sucesso.'
  );
END;
$$;

-- 5. FUNÇÃO RPC PARA ACEITAR CONVITE EXIGINDO TOKEN VÁLIDO E AUTENTICAÇÃO
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
  -- 1. Exige que o usuário esteja autenticado no Supabase
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado. Faça login ou crie uma conta para aceitar o convite.';
  END IF;

  -- 2. Exige obrigatoriamente o token do convite
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'Token de convite inválido ou ausente. O acesso a viagens privadas exige um link de convite oficial.';
  END IF;

  -- 3. Valida se a viagem existe e não está arquivada
  SELECT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id AND is_archived = false
  ) INTO v_trip_exists;

  IF NOT v_trip_exists THEN
    RAISE EXCEPTION 'A viagem informada não existe ou foi arquivada.';
  END IF;

  -- 4. Valida se o token pertence à viagem e se é legítimo
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

  -- 5. Se o usuário já é membro desta viagem, apenas confirma sem duplicar
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

  -- 6. Obtém o nome cadastrado no perfil
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;
  v_user_name := COALESCE(v_user_name, 'Participante');

  -- 7. Tratamento de casal (opcional)
  IF p_is_couple AND p_partner_name IS NOT NULL AND length(trim(p_partner_name)) >= 2 THEN
    v_partner_user_id := gen_random_uuid();
    v_couple_id := gen_random_uuid();

    INSERT INTO public.profiles (
      id,
      full_name,
      avatar_url
    ) VALUES (
      v_partner_user_id,
      trim(p_partner_name),
      'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(trim(p_partner_name)::bytea, 'hex')
    );

    INSERT INTO public.couples (
      id,
      trip_id,
      label,
      member_a_id,
      member_b_id
    ) VALUES (
      v_couple_id,
      p_trip_id,
      v_user_name || ' & ' || trim(p_partner_name),
      v_user_id,
      v_partner_user_id
    );

    v_partner_member_id := gen_random_uuid();
    INSERT INTO public.trip_members (
      id,
      trip_id,
      profile_id,
      role,
      confirmation_status,
      couple_id
    ) VALUES (
      v_partner_member_id,
      p_trip_id,
      v_partner_user_id,
      'member',
      'pending',
      v_couple_id
    );
  END IF;

  -- 8. Insere o participante autenticado como 'member' confirmado
  -- REGRA FUNDAMENTAL: NUNCA CONCEDE PRIVILÉGIOS DE ADMINISTRADOR
  v_member_id := gen_random_uuid();
  INSERT INTO public.trip_members (
    id,
    trip_id,
    profile_id,
    role,
    confirmation_status,
    couple_id,
    confirmed_at
  ) VALUES (
    v_member_id,
    p_trip_id,
    v_user_id,
    'member',
    'confirmed',
    v_couple_id,
    now()
  );

  -- 9. Incrementa contador e data de último uso do convite
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

-- 6. PERMISSÕES DE EXECUÇÃO SEGURAS (SECURITY BY DEFAULT)
REVOKE ALL ON FUNCTION public.get_or_create_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.regenerate_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_trip_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_trip_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) TO authenticated;

COMMENT ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) IS
  'Permite que um usuário autenticado ingresse na viagem via link de convite seguro com token obrigatório, com papel estrito de member.';
