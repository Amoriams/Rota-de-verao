// ============================================================
//  ROTA DE VERÃO — Supabase Edge Function: verify-pin
//  Validação segura de código PIN de 6 dígitos com:
//  - Rate limiting atômico contra força bruta (por IP e por convite no PostgreSQL)
//  - Verificação de hash (bcrypt via pgcrypto com salt individual)
//  - Proteção contra timing attacks e enumeração de convites
//  - Validação de expiração e revogação
//  - Emissão de sessão JWT legítima via Supabase Auth Admin
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Trata requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Ambiente Supabase não configurado no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente com permissões de administrador (service_role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extrai IP do cliente com prioridade para cabeçalhos confiáveis do gateway/edge
    // Nunca confia cegamente no primeiro item de x-forwarded-for que pode ser injetado pelo cliente
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      "unknown-ip";

    const body = await req.json().catch(() => ({}));
    const pin = (body.pin ?? "").toString().trim();
    const token = (body.token ?? "").toString().trim();

    if (!pin && !token) {
      return new Response(
        JSON.stringify({ error: "Informe o código PIN ou link de convite." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // EXECUÇÃO ATÔMICA DA VALIDAÇÃO NO BANCO DE DADOS (POSTGRESQL)
    // O RPC 'verify_invitation_pin' realiza:
    // 1. Rate limiting com lock de linha (FOR UPDATE) em auth_rate_limits
    // 2. Verificação de convites ativos com bcrypt via pgcrypto
    // 3. Execução de dummy bcrypt para neutralizar enumeração e timing attacks
    // 4. Bloqueio automático de convite e IP em caso de excesso de tentativas
    // ─────────────────────────────────────────────────────────
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc("verify_invitation_pin", {
      p_pin: pin || null,
      p_token: token || null,
      p_ip: clientIp,
    });

    if (rpcErr) {
      console.error("Erro ao executar verify_invitation_pin RPC:", rpcErr);
      return new Response(
        JSON.stringify({ error: "Falha na validação de segurança do convite." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rpcRes || !rpcRes.success) {
      const statusCode = rpcRes?.code === "BLOCKED_IP" ? 429 : 401;
      return new Response(
        JSON.stringify({
          error: rpcRes?.message || "Código PIN incorreto ou convite inválido.",
          code: rpcRes?.code || "INVALID_CREDENTIALS",
        }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // EMISSÃO DE SESSÃO REAL VIA SUPABASE AUTH ADMIN
    // ─────────────────────────────────────────────────────────
    const userEmail = rpcRes.email;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Conta de participante não encontrada para emissão de credenciais." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gera o token de acesso (Magic Link / OTP) para estabelecer a sessão do usuário
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    });

    if (linkErr || !linkData) {
      console.error("Erro ao gerar link de autenticação:", linkErr);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar credencial de sessão do participante." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        hashed_token: linkData.properties?.hashed_token,
        email: userEmail,
        profile_id: rpcRes.profile_id,
        trip_id: rpcRes.trip_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno no servidor de autenticação.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
