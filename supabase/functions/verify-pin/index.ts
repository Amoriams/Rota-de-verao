// ============================================================
//  ROTA DE VERÃO — Supabase Edge Function: verify-pin
//  Validação segura de código PIN de 6 dígitos com:
//  - Rate limiting contra força bruta (por IP e por convite)
//  - Verificação de hash (SHA-256 com salt)
//  - Validação de expiração e revogação
//  - Emissão de sessão JWT legítima via Supabase Auth Admin
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função criptográfica para calcular hash SHA-256 com salt
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    // Extrai IP do cliente e corpo da requisição
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    const body = await req.json();
    const pin = (body.pin ?? "").toString().trim();
    const token = (body.token ?? "").toString().trim();

    if (!pin && !token) {
      return new Response(
        JSON.stringify({ error: "Informe o código PIN ou token de acesso." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 1. RATE LIMITING POR IP (Proteção contra força bruta)
    // ─────────────────────────────────────────────────────────
    const now = new Date().toISOString();

    const { data: ipLimit } = await supabaseAdmin
      .from("auth_rate_limits")
      .select("*")
      .eq("ip_address", clientIp)
      .eq("identifier", "ip-global")
      .maybeSingle();

    if (ipLimit && ipLimit.blocked_until && new Date(ipLimit.blocked_until) > new Date()) {
      const waitMinutes = Math.ceil(
        (new Date(ipLimit.blocked_until).getTime() - Date.now()) / (1000 * 60)
      );
      return new Response(
        JSON.stringify({
          error: `Muitas tentativas a partir deste endereço. Tente novamente em ${waitMinutes} minuto(s).`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 2. BUSCA DO CONVITE (Ativo e não expirado)
    // ─────────────────────────────────────────────────────────
    let query = supabaseAdmin
      .from("invitations")
      .select("*, profile:profiles(*)")
      .eq("is_revoked", false)
      .gt("expires_at", now);

    if (token) {
      query = query.eq("token", token);
    }

    const { data: invitations, error: inviteErr } = await query;

    if (inviteErr || !invitations || invitations.length === 0) {
      // Registra falha de tentativa no IP
      await recordFailedAttempt(supabaseAdmin, clientIp, "ip-global", ipLimit);

      return new Response(
        JSON.stringify({ error: "Código PIN ou convite inválido ou expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se a busca for por PIN, compara o hash com salt (trip_id serve como salt seguro)
    let matchedInvite = null;

    if (token) {
      matchedInvite = invitations[0];
    } else {
      for (const inv of invitations) {
        // Verifica bloqueio temporário do convite
        if (inv.blocked_until && new Date(inv.blocked_until) > new Date()) {
          return new Response(
            JSON.stringify({
              error: "Este convite está temporariamente bloqueado por excesso de tentativas. Fale com a organizadora.",
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const calculatedHash = await hashPin(pin, inv.trip_id);
        if (calculatedHash === inv.pin_hash) {
          matchedInvite = inv;
          break;
        } else {
          // Incrementa tentativas incorretas no convite
          const nextCount = (inv.attempt_count || 0) + 1;
          const blockedUntil = nextCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

          await supabaseAdmin
            .from("invitations")
            .update({
              attempt_count: nextCount,
              last_attempt_at: now,
              blocked_until: blockedUntil,
            })
            .eq("id", inv.id);
        }
      }
    }

    if (!matchedInvite) {
      await recordFailedAttempt(supabaseAdmin, clientIp, "ip-global", ipLimit);

      return new Response(
        JSON.stringify({ error: "Código PIN incorreto." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────
    // 3. SUCESSO: ZERA TENTATIVAS E EMITE SESSÃO REAL (JWT)
    // ─────────────────────────────────────────────────────────
    await supabaseAdmin
      .from("invitations")
      .update({
        attempt_count: 0,
        blocked_until: null,
        last_used_at: now,
      })
      .eq("id", matchedInvite.id);

    // Zera também o rate limit do IP
    if (ipLimit) {
      await supabaseAdmin
        .from("auth_rate_limits")
        .update({ attempt_count: 0, blocked_until: null })
        .eq("id", ipLimit.id);
    }

    // Obtém o e-mail ou dados de autenticação do usuário vinculado ao perfil
    const { data: authUserData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      matchedInvite.profile_id
    );

    if (userErr || !authUserData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Conta de participante não encontrada no sistema de autenticação." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gera um link de login mágico com emissão direta de token
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: authUserData.user.email,
    });

    if (linkErr || !linkData) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar credencial de sessão." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        hashed_token: linkData.properties?.hashed_token,
        email: authUserData.user.email,
        profile_id: matchedInvite.profile_id,
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

// Helper para registrar tentativas falhas no IP
async function recordFailedAttempt(
  supabaseAdmin: any,
  ip: string,
  identifier: string,
  existing: any
) {
  const count = (existing?.attempt_count || 0) + 1;
  const blockedUntil = count >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

  if (existing) {
    await supabaseAdmin
      .from("auth_rate_limits")
      .update({
        attempt_count: count,
        blocked_until: blockedUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("auth_rate_limits").insert({
      ip_address: ip,
      identifier: identifier,
      attempt_count: 1,
      blocked_until: null,
    });
  }
}
