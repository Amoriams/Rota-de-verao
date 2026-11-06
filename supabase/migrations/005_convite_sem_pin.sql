-- ============================================================
-- ROTA DE VERÃO — Migração 005: Convites Diretos sem Exigência de PIN
-- Permite que usuários autenticados ingressem em viagens por link de convite
-- sem exigir criação ou validação de PIN de 6 dígitos.
-- ============================================================

-- 1. FUNÇÃO RPC PARA ACEITAR CONVITE DE VIAGEM COM CONTA AUTENTICADA (SEM PIN)
CREATE OR REPLACE FUNCTION public.accept_trip_invitation(
  p_trip_id UUID,
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

  -- 2. Valida se a viagem existe e não está arquivada
  SELECT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = p_trip_id AND is_archived = false
  ) INTO v_trip_exists;

  IF NOT v_trip_exists THEN
    RAISE EXCEPTION 'A viagem informada não existe ou foi arquivada.';
  END IF;

  -- 3. Verifica se o usuário já é membro desta viagem
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

  -- 4. Obtém o nome cadastrado no perfil
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;
  v_user_name := COALESCE(v_user_name, 'Participante');

  -- 5. Tratamento de casal (opcional)
  IF p_is_couple AND p_partner_name IS NOT NULL AND length(trim(p_partner_name)) >= 2 THEN
    v_partner_user_id := gen_random_uuid();
    v_couple_id := gen_random_uuid();

    -- Cria perfil para o parceiro
    INSERT INTO public.profiles (
      id,
      full_name,
      avatar_url
    ) VALUES (
      v_partner_user_id,
      trim(p_partner_name),
      'https://api.dicebear.com/7.x/bottts/svg?seed=' || encode(trim(p_partner_name)::bytea, 'hex')
    );

    -- Cria o registro na tabela de casais
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

    -- Insere o parceiro com confirmação pendente e papel 'member'
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

  -- 6. Insere o participante autenticado como 'member' confirmado
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

  RETURN jsonb_build_object(
    'success', true,
    'already_member', false,
    'member_id', v_member_id,
    'profile_id', v_user_id,
    'trip_id', p_trip_id
  );
END;
$$;

COMMENT ON FUNCTION public.accept_trip_invitation(UUID, BOOLEAN, VARCHAR) IS
  'Permite que um usuário autenticado ingresse na viagem via link de convite sem necessidade de PIN, com papel estrito de member.';
