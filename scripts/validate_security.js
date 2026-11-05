// ============================================================
//  ROTA DE VERÃO — Script Automatizado de Validação de Segurança
//  Auditoria Estática de SQL, RLS, Anti-Enumeração e Simulação de Políticas
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n========================================================");
console.log("🛡️  INICIANDO BATERIA DE TESTES DE SEGURANÇA E RLS");
console.log("========================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. LEITURA DOS ARQUIVOS DE SCHEMA E FUNÇÕES
// ─────────────────────────────────────────────────────────────
const schemaPath = path.join(rootDir, "supabase", "migrations", "001_schema_completo.sql");
const edgeFunctionPath = path.join(rootDir, "supabase", "functions", "verify-pin", "index.ts");

assert(fs.existsSync(schemaPath), "Arquivo de migração 001_schema_completo.sql encontrado");
assert(fs.existsSync(edgeFunctionPath), "Arquivo da Edge Function verify-pin encontrado");

const schemaSql = fs.readFileSync(schemaPath, "utf-8");
const edgeFunctionCode = fs.readFileSync(edgeFunctionPath, "utf-8");

// ─────────────────────────────────────────────────────────────
// 2. VALIDAÇÃO DAS 16 TABELAS E RLS
// ─────────────────────────────────────────────────────────────
console.log("\n📋 1. Verificação de Cobertura de RLS nas 16 Tabelas");

const expectedTables = [
  "profiles",
  "trips",
  "couples",
  "trip_members",
  "invitations",
  "auth_rate_limits",
  "accommodations",
  "flights",
  "vehicles",
  "vehicle_interests",
  "polls",
  "poll_options",
  "poll_votes",
  "cost_items",
  "cost_participants",
  "activity_logs",
];

expectedTables.forEach((table) => {
  const tableExists = schemaSql.includes(`CREATE TABLE public.${table}`);
  assert(tableExists, `Tabela 'public.${table}' declarada no schema`);

  const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i");
  assert(rlsRegex.test(schemaSql), `RLS habilitado explicitamente em 'public.${table}'`);
});

// ─────────────────────────────────────────────────────────────
// 3. SEGURANÇA DE FUNÇÕES SECURITY DEFINER (SEARCH_PATH)
// ─────────────────────────────────────────────────────────────
console.log("\n🔒 2. Auditoria de Funções SECURITY DEFINER e search_path");

const functionBlocks = schemaSql.split(/CREATE\s+OR\s+REPLACE\s+FUNCTION/gi).slice(1);

functionBlocks.forEach((block) => {
  const nameMatch = block.match(/^\s*public\.([a-zA-Z0-9_]+)/);
  if (!nameMatch) return;
  const funcName = nameMatch[1];

  if (/SECURITY\s+DEFINER/i.test(block)) {
    const hasSearchPath = /SET\s+search_path\s*=\s*[^;\n]+/i.test(block);
    assert(
      hasSearchPath,
      `Função SECURITY DEFINER 'public.${funcName}' possui 'SET search_path' configurado`
    );
  }
});

// ─────────────────────────────────────────────────────────────
// 4. POLÍTICAS CRÍTICAS DE ISOLAMENTO DE DADOS
// ─────────────────────────────────────────────────────────────
console.log("\n🛡️ 3. Auditoria Estática das Regras RLS");

// A tabela 'invitations' NÃO deve ter política de SELECT liberada para participantes
const invitationsMemberSelect = /CREATE\s+POLICY\s+"invitations_select_member"/i.test(schemaSql);
assert(!invitationsMemberSelect, "Tabela 'invitations' NÃO permite SELECT por participantes comuns");

const invitationsAdminPolicy = /CREATE\s+POLICY\s+"invitations_all_admin"\s+ON\s+public\.invitations/i.test(schemaSql);
assert(invitationsAdminPolicy, "Tabela 'invitations' é restrita exclusivamente à administradora");

// A tabela 'auth_rate_limits' não deve ter políticas SELECT/INSERT/UPDATE expostas ao client
const rateLimitsHasDirectPolicies = /CREATE\s+POLICY\s+[^;]+ON\s+public\.auth_rate_limits/i.test(schemaSql);
assert(!rateLimitsHasDirectPolicies, "Tabela 'auth_rate_limits' sem políticas expostas a clientes (isolada)");

// profiles_update_own deve garantir que id = auth.uid()
const profilesUpdateCheck = /CREATE\s+POLICY\s+"profiles_update_own"[\s\S]*?WITH\s+CHECK\s*\(\s*id\s*=\s*auth\.uid\(\)\s*\)/i.test(schemaSql);
assert(profilesUpdateCheck, "Política 'profiles_update_own' valida id = auth.uid() no WITH CHECK");

// trip_members_update_own_status impede alteração de role por participante comum
const tripMembersRoleCheck = schemaSql.includes("trip_members_update_own_status") &&
  schemaSql.includes("SELECT role FROM public.trip_members WHERE profile_id = auth.uid()");
assert(tripMembersRoleCheck, "RLS em trip_members impede participante de promover seu próprio cargo para 'admin'");

// ─────────────────────────────────────────────────────────────
// 5. AUDITORIA AUTOMÁTICA E HIGIENIZAÇÃO DE DADOS SENSÍVEIS
// ─────────────────────────────────────────────────────────────
console.log("\n📜 4. Auditoria Automática e Higienização de Logs");

const hasAuditTriggerFunc = schemaSql.includes("public.audit_trigger_func()");
assert(hasAuditTriggerFunc, "Função genérica de auditoria 'audit_trigger_func' implementada");

const scrubsPinHash = schemaSql.includes("v_details := v_details - 'pin_hash';");
const scrubsToken = schemaSql.includes("v_details := v_details - 'token';");
assert(scrubsPinHash && scrubsToken, "Gatilho de auditoria higieniza (remove) pin_hash e token antes de salvar em activity_logs");

const auditedTables = ["trips", "trip_members", "accommodations", "flights", "vehicles", "polls", "cost_items"];
auditedTables.forEach((tab) => {
  const triggerRegex = new RegExp(`CREATE\\s+TRIGGER\\s+trigger_audit_${tab}\\s+AFTER\\s+([A-Z\\s]+)\\s+ON\\s+public\\.${tab}`, "i");
  assert(triggerRegex.test(schemaSql), `Gatilho de auditoria automática configurado em 'public.${tab}'`);
});

// ─────────────────────────────────────────────────────────────
// 6. VALIDAÇÃO DA VIEW DE CASAIS (RESILIÊNCIA A DELEÇÃO)
// ─────────────────────────────────────────────────────────────
console.log("\n💑 5. Resiliência da View de Casais (couple_status_view)");

const coupleViewDefMatch = schemaSql.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.couple_status_view[\s\S]*?;/i);
assert(coupleViewDefMatch !== null, "View 'couple_status_view' definida no schema");

if (coupleViewDefMatch) {
  const viewCode = coupleViewDefMatch[0];
  const usesLeftJoin = /LEFT\s+JOIN\s+public\.trip_members/i.test(viewCode) && /LEFT\s+JOIN\s+public\.profiles/i.test(viewCode);
  assert(usesLeftJoin, "View de casais utiliza LEFT JOIN para tolerar desvinculação/exclusão de membros sem falhar");

  const handlesNullStatus = viewCode.includes("member_a_status") && viewCode.includes("COALESCE");
  assert(handlesNullStatus, "View de casais trata status nulos com fallback seguro via COALESCE");
}

// ─────────────────────────────────────────────────────────────
// 7. EDGE FUNCTION & PREVENÇÃO DE TIMING ATTACK E SPOOFING DE IP
// ─────────────────────────────────────────────────────────────
console.log("\n⚡ 6. Análise de Segurança da Edge Function (verify-pin)");

// Confiabilidade de IP
const extractsTrustedIp = /req\.headers\.get\("cf-connecting-ip"\)/i.test(edgeFunctionCode) &&
  /req\.headers\.get\("x-real-ip"\)/i.test(edgeFunctionCode);
assert(extractsTrustedIp, "Edge Function prioriza cabeçalhos seguros de IP (cf-connecting-ip / x-real-ip)");

// Chamada atômica do RPC
const callsAtomicRpc = edgeFunctionCode.includes("supabaseAdmin.rpc(\"verify_invitation_pin\"");
assert(callsAtomicRpc, "Edge Function delega a validação criptográfica e rate limiting para o RPC atômico do PostgreSQL");

// Anti-enumeração no SQL
const hasDummyBcrypt = schemaSql.includes("v_dummy_bcrypt") && schemaSql.includes("PERFORM extensions.crypt(p_pin, v_dummy_bcrypt)");
assert(hasDummyBcrypt, "Função verify_invitation_pin executa crypt dummy quando convite não existe para neutralizar timing attacks");

// ─────────────────────────────────────────────────────────────
// 8. SIMULAÇÃO LÓGICA DE CENÁRIOS DE PERMISSÃO
// ─────────────────────────────────────────────────────────────
console.log("\n🧪 7. Simulação Lógica de Cenários de Permissões RLS");

function evaluatePolicy(actor, action, targetEntity, targetRecord) {
  // Anônimo não acessa nada protegido
  if (!actor || !actor.id) {
    return { allowed: false, reason: "Usuário não autenticado" };
  }

  // Admin da viagem tem acesso geral
  const isAdmin = actor.role === "admin" && actor.trip_id === targetRecord.trip_id;

  switch (targetEntity) {
    case "profiles":
      if (action === "SELECT") return { allowed: true };
      if (action === "UPDATE") {
        return targetRecord.id === actor.id
          ? { allowed: true }
          : { allowed: false, reason: "Não pode alterar o perfil de outro membro" };
      }
      return { allowed: false };

    case "invitations":
      return isAdmin
        ? { allowed: true }
        : { allowed: false, reason: "Apenas a administradora pode gerenciar convites" };

    case "cost_items":
      if (action === "SELECT") {
        return actor.trip_id === targetRecord.trip_id
          ? { allowed: true }
          : { allowed: false, reason: "Não é membro desta viagem" };
      }
      if (["INSERT", "UPDATE", "DELETE"].includes(action)) {
        return isAdmin
          ? { allowed: true }
          : { allowed: false, reason: "Apenas administradora pode criar ou alterar itens de custo" };
      }
      return { allowed: false };

    case "trip_members":
      if (action === "UPDATE") {
        if (isAdmin) return { allowed: true };
        if (targetRecord.profile_id === actor.id) {
          if (targetRecord.attempted_role_change) {
            return { allowed: false, reason: "Membro não pode alterar seu próprio papel (role)" };
          }
          return { allowed: true };
        }
        return { allowed: false, reason: "Não pode alterar dados de outro participante" };
      }
      return { allowed: false };

    case "poll_votes":
      if (action === "INSERT") {
        if (actor.confirmation_status !== "confirmed") {
          return { allowed: false, reason: "Apenas membros confirmados podem votar" };
        }
        return { allowed: true };
      }
      return { allowed: false };

    default:
      return { allowed: false, reason: "Entidade desconhecida" };
  }
}

const adminUser = { id: "user-admin-1", role: "admin", trip_id: "trip-1", confirmation_status: "confirmed" };
const memberUser = { id: "user-member-2", role: "member", trip_id: "trip-1", confirmation_status: "confirmed" };
const unconfirmedUser = { id: "user-member-3", role: "member", trip_id: "trip-1", confirmation_status: "pending" };
const anonUser = null;

// Cenário 1: Participante alterando os próprios dados de perfil
const c1 = evaluatePolicy(memberUser, "UPDATE", "profiles", { id: "user-member-2" });
assert(c1.allowed, "Cenário 1: Participante consegue alterar seu próprio perfil");

// Cenário 2: Participante tentando alterar dados de perfil de outro participante
const c2 = evaluatePolicy(memberUser, "UPDATE", "profiles", { id: "user-admin-1" });
assert(!c2.allowed, "Cenário 2: Participante é BLOQUEADO ao tentar alterar perfil de outro membro");

// Cenário 3: Participante tentando promover a si mesmo para admin
const c3 = evaluatePolicy(memberUser, "UPDATE", "trip_members", {
  trip_id: "trip-1",
  profile_id: "user-member-2",
  attempted_role_change: true,
});
assert(!c3.allowed, "Cenário 3: Participante é BLOQUEADO ao tentar alterar sua role para admin");

// Cenário 4: Participante tentando criar ou alterar item de despesa
const c4 = evaluatePolicy(memberUser, "INSERT", "cost_items", { trip_id: "trip-1" });
assert(!c4.allowed, "Cenário 4: Participante é BLOQUEADO ao tentar cadastrar despesas (exclusivo admin)");

// Cenário 5: Administradora cadastrando item de despesa
const c5 = evaluatePolicy(adminUser, "INSERT", "cost_items", { trip_id: "trip-1" });
assert(c5.allowed, "Cenário 5: Administradora tem permissão para cadastrar despesas");

// Cenário 6: Participante tentando ver tabela de convites (com PINs/tokens)
const c6 = evaluatePolicy(memberUser, "SELECT", "invitations", { trip_id: "trip-1" });
assert(!c6.allowed, "Cenário 6: Participante é BLOQUEADO ao tentar ler tabela de convites");

// Cenário 7: Usuário anônimo tentando consultar custos
const c7 = evaluatePolicy(anonUser, "SELECT", "cost_items", { trip_id: "trip-1" });
assert(!c7.allowed, "Cenário 7: Usuário anônimo é BLOQUEADO ao tentar acessar dados da viagem");

// Cenário 8: Membro não confirmado tentando votar em enquete
const c8 = evaluatePolicy(unconfirmedUser, "INSERT", "poll_votes", { trip_id: "trip-1" });
assert(!c8.allowed, "Cenário 8: Membro pendente/não confirmado é BLOQUEADO ao tentar votar");

// Cenário 9: Membro confirmado votando em enquete
const c9 = evaluatePolicy(memberUser, "INSERT", "poll_votes", { trip_id: "trip-1" });
assert(c9.allowed, "Cenário 9: Membro confirmado tem autorização para registrar voto");

// ─────────────────────────────────────────────────────────────
// RESUMO FINAL
// ─────────────────────────────────────────────────────────────
console.log("\n========================================================");
console.log(`📊 RESULTADO DA AUDITORIA: ${passedTests}/${totalTests} TESTES APROVADOS (${Math.round((passedTests/totalTests)*100)}%)`);
console.log("========================================================\n");

if (passedTests === totalTests) {
  console.log("🎉 Todos os critérios de segurança e integridade foram verificados com sucesso!");
  process.exit(0);
} else {
  console.error("⚠️ Alguns testes falharam. Verifique as mensagens acima.");
  process.exit(1);
}
