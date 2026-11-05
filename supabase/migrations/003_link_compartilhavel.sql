-- ============================================================
-- ROTA DE VERÃO — Migração 003: Entrada por Link Compartilhável
-- Permite que qualquer participante com o link da viagem ingresse
-- informando seu nome, criando um PIN de 6 dígitos e optando por casal
-- ============================================================

-- 1. FUNÇÃO RPC ATÔMICA PARA ENTRADA POR LINK COMPARTILHÁVEL
CREATE OR REPLACE FUNCTION public.join_trip_by_share_link(
  p_trip_id UUID,
  p_full_name VARCHAR(100),
  p_nickname VARCHAR(50) DEFAULT NULL,
  p_phone VARCHAR(20) DEFAULT NULL,
  p_pin VARCHAR(6) DEFAULT NULL,
  p_is_couple BOOLEAN DEFAULT false,
  p_partner_name VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_trip_exists BOOLEAN;
  v_user_id UUID;
  v_member_id UUID;
  v_couple_id UUID := NULL;
  v_partner_user_id UUID;
  v_partner_member_id UUID;
  v_pin_hash TEXT;
BEGIN
  -- 1. Valida se a viagem existe e não está arquivada
  SELECT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id AND is_archived = false
  ) INTO v_trip_exists;

  IF NOT v_trip_exists THEN
    RAISE EXCEPTION 'A viagem informada não existe ou está arquivada.';
  END IF;

  -- 2. Valida nome e PIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Informe um nome completo válido.';
  END IF;

  IF p_pin IS NULL OR length(trim(p_pin)) <> 6 THEN
    RAISE EXCEPTION 'O PIN de acesso deve conter exatamente 6 dígitos.';
  END IF;

  -- 3. Cria ID de usuário para o perfil
  v_user_id := gen_random_uuid();
  v_pin_hash := extensions.crypt(p_pin, extensions.gen_salt('bf', 10));

  -- 4. Insere o perfil do participante
  INSERT INTO public.profiles (
    id,
    full_name,
    nickname,
    phone,
    avatar_url
  ) VALUES (
    v_user_id,
    trim(p_full_name),
    nullif(trim(p_nickname), ''),
    nullif(trim(p_phone), ''),
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(trim(p_full_name)::bytea, 'hex')
  );

  -- 5. Se for casal com parceiro informado, cria perfil do parceiro e grupo de casal
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
      trim(p_full_name) || ' & ' || trim(p_partner_name),
      v_user_id,
      v_partner_user_id
    );

    -- Insere o parceiro no trip_members com confirmação pendente
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

  -- 6. Insere o participante principal como confirmado
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

  -- 7. Cria convite correspondente com o PIN para permitir login futuro
  INSERT INTO public.invitations (
    trip_id,
    profile_id,
    pin_hash,
    token,
    expires_at
  ) VALUES (
    p_trip_id,
    v_user_id,
    v_pin_hash,
    encode(gen_random_bytes(24), 'hex'),
    now() + INTERVAL '180 days'
  );

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_user_id,
    'member_id', v_member_id,
    'trip_id', p_trip_id,
    'couple_id', v_couple_id
  );
END;
$$;

COMMENT ON FUNCTION public.join_trip_by_share_link(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, BOOLEAN, VARCHAR) IS
  'Permite a entrada imediata de um convidado em uma viagem através do link compartilhável.';

