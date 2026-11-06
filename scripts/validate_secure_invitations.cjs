/**
 * validate_secure_invitations.cjs
 * Bateria de Testes de Segurança, RLS e Hashing de Tokens
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CLASSIFICAÇÃO DOS TESTES                                   ║
 * ║                                                              ║
 * ║  🟢 ANÁLISE ESTÁTICA — Validação do código SQL gerado.       ║
 * ║     Executa leitura e regex sobre CONSOLIDATED_SETUP.sql.    ║
 * ║     NÃO prova comportamento em PostgreSQL real.              ║
 * ║                                                              ║
 * ║  🔵 SIMULAÇÃO LOCAL — Mock Engine que reproduz a lógica      ║
 * ║     das funções SQL e políticas RLS em JavaScript.            ║
 * ║     Comprova a lógica de negócio, mas NÃO executa SQL real.  ║
 * ║                                                              ║
 * ║  🔴 INTEGRAÇÃO REAL — Necessita PostgreSQL/Supabase rodando. ║
 * ║     NÃO implementado neste script. Será feito na etapa de    ║
 * ║     testes E2E (Marco 9).                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cenários:
 *  1. Isolamento de viagens entre contas
 *  2. Proteção de papéis (autopromoção bloqueada)
 *  3. Proteção de couple_id (alteração por não-admin bloqueada)
 *  4. Validação criptográfica de convites (token, hash, expiração, revogação)
 *  5. Fallback sem Supabase retorna erro (não simula sucesso)
 *  6. Regeneração de convite: revoga anterior, gera novo
 *  7. Auditoria estática do SQL (search_path, REVOKE, IS DISTINCT FROM, etc.)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let passed = 0;
let total = 0;
let failed = [];

function assert(condition, description, category = '🔵 SIMULAÇÃO') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failed.push(description);
    console.log(`  ❌ [FAIL] ${description}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🛡️  VALIDAÇÃO DE SEGURANÇA — ROTA DE VERÃO (v2 com classificação)');
console.log('═══════════════════════════════════════════════════════════════\n');

const basePath = path.resolve(__dirname, '..');
const consolidatedSql = fs.readFileSync(path.join(basePath, 'supabase/migrations/CONSOLIDATED_SETUP.sql'), 'utf8');
const memberServiceTs = fs.readFileSync(path.join(basePath, 'src/services/memberService.ts'), 'utf8');

// ── Simulação de Contas e Viagens ─────────────────────────────────────────────
const userA = { id: 'usr-a-admin', name: 'Conta A (Admin Viagem A)' };
const userB = { id: 'usr-b-mixed', name: 'Conta B (Member A / Admin B)' };
const userC = { id: 'usr-c-isolated', name: 'Conta C (Sem Vínculo)' };

const tripA = { id: 'trip-a-1111', title: 'Viagem A', created_by: userA.id };
const tripB = { id: 'trip-b-2222', title: 'Viagem B', created_by: userB.id };

/**
 * Mock Engine que reproduz a lógica das funções SQL e políticas RLS
 * Atualizado para incluir proteção de couple_id e IS DISTINCT FROM
 */
class MockPostgresSecurityEngine {
  constructor() {
    this.trips = [tripA, tripB];
    this.members = [
      { id: 'tm-1', trip_id: tripA.id, profile_id: userA.id, role: 'admin', confirmation_status: 'confirmed', couple_id: null },
      { id: 'tm-2', trip_id: tripB.id, profile_id: userB.id, role: 'admin', confirmation_status: 'confirmed', couple_id: null },
    ];
    this.expenses = [
      { id: 'exp-1', trip_id: tripA.id, payer_id: userA.id, title: 'Hotel Viagem A', total_amount: 5000 },
      { id: 'exp-2', trip_id: tripB.id, payer_id: userB.id, title: 'Aluguel Viagem B', total_amount: 3000 },
    ];
    this.invitations = [];
    this.couples = [];
  }

  isTripMember(userId, tripId) {
    return this.members.some((m) => m.trip_id === tripId && m.profile_id === userId);
  }

  isTripAdmin(userId, tripId) {
    const isOwner = this.trips.some((t) => t.id === tripId && t.created_by === userId);
    const isMemberAdmin = this.members.some((m) => m.trip_id === tripId && m.profile_id === userId && m.role === 'admin');
    return isOwner || isMemberAdmin;
  }

  selectTrips(userId) {
    return this.trips.filter((t) => t.created_by === userId || this.isTripMember(userId, t.id));
  }

  selectExpenses(userId, tripId) {
    if (!this.isTripMember(userId, tripId) && !this.isTripAdmin(userId, tripId)) {
      return [];
    }
    return this.expenses.filter((e) => e.trip_id === tripId);
  }

  /**
   * get_or_create_trip_invite — versão corrigida.
   * Se já existe convite ativo, retorna metadados SEM o token.
   * Se não existe, gera novo.
   */
  getOrCreateInvite(adminId, tripId) {
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode gerenciar convites.');
    }

    // Verifica se já existe convite ativo e não expirado
    const existing = this.invitations.find(
      (i) => i.trip_id === tripId && !i.is_revoked && new Date(i.expires_at) > new Date()
    );

    if (existing) {
      return { token: null, expires_at: existing.expires_at, is_new: false };
    }

    // Gera novo
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.invitations.push({
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      trip_id: tripId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });

    return { token: rawToken, expires_at: this.invitations[this.invitations.length - 1].expires_at, is_new: true };
  }

  /**
   * regenerate_trip_invite — revoga anterior e gera novo token.
   * Sempre retorna o novo token.
   */
  regenerateInvite(adminId, tripId) {
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode regenerar o link de convite.');
    }

    // Revoga todos os ativos
    this.invitations.forEach((i) => {
      if (i.trip_id === tripId && !i.is_revoked) i.is_revoked = true;
    });

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.invitations.push({
      id: 'inv-regen-' + Date.now(),
      trip_id: tripId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });

    return { token: rawToken, expires_at: this.invitations[this.invitations.length - 1].expires_at };
  }

  revokeInvite(adminId, tripId) {
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora pode revogar convites.');
    }
    this.invitations.forEach((i) => {
      if (i.trip_id === tripId) i.is_revoked = true;
    });
  }

  acceptInvitation(userId, tripId, rawToken, isCouple = false, partnerName = null) {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!rawToken || rawToken.trim().length < 8) {
      throw new Error('Token de convite inválido ou ausente.');
    }

    const presentedHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const invite = this.invitations.find((i) => i.trip_id === tripId && i.token_hash === presentedHash);

    if (!invite) throw new Error('Convite inválido para esta viagem.');
    if (invite.is_revoked) throw new Error('Este link de convite foi revogado pela administradora.');
    if (new Date(invite.expires_at) < new Date()) throw new Error('Este link de convite expirou.');

    if (isCouple && partnerName) {
      this.couples.push({
        id: 'couple-' + Date.now(),
        trip_id: tripId,
        member_a_id: userId,
        member_b_id: null,
        partner_name: partnerName,
      });
    }

    const newMember = {
      id: 'tm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      trip_id: tripId,
      profile_id: userId,
      role: 'member',
      confirmation_status: 'confirmed',
      couple_id: null,
    };
    this.members.push(newMember);
    return newMember;
  }

  /**
   * Trigger check_trip_member_update — atualizado para proteger couple_id
   * e usar IS DISTINCT FROM (equivalente JS: comparação que trata null !== undefined vs null)
   */
  updateMember(userId, memberId, updates = {}) {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Membro não encontrado.');

    const isAdmin = this.isTripAdmin(userId, member.trip_id);

    // Simula IS DISTINCT FROM: valores são "distintos" se forem diferentes,
    // incluindo null vs non-null
    function isDistinct(a, b) {
      if (a === null && b === null) return false;
      if (a === undefined && b === undefined) return false;
      if (a === null || b === null) return true;
      if (a === undefined || b === undefined) return true;
      return a !== b;
    }

    if (!isAdmin) {
      if ('role' in updates && isDistinct(updates.role, member.role)) {
        throw new Error('Acesso negado: apenas a administradora pode alterar papéis de participantes.');
      }
      if ('profile_id' in updates && isDistinct(updates.profile_id, member.profile_id)) {
        throw new Error('Acesso negado: não é permitido alterar o usuário desta participação.');
      }
      if ('trip_id' in updates && isDistinct(updates.trip_id, member.trip_id)) {
        throw new Error('Acesso negado: não é permitido transferir o registro para outra viagem.');
      }
      if ('couple_id' in updates && isDistinct(updates.couple_id, member.couple_id)) {
        throw new Error('Acesso negado: apenas a administradora pode alterar o vínculo de casal.');
      }
    }

    // Aplica atualizações permitidas
    if ('confirmation_status' in updates) member.confirmation_status = updates.confirmation_status;
    if (isAdmin) {
      if ('role' in updates) member.role = updates.role;
      if ('couple_id' in updates) member.couple_id = updates.couple_id;
    }

    return member;
  }
}

const db = new MockPostgresSecurityEngine();

// ═══════════════════════════════════════════════════════════════════
// BLOCO 1: ISOLAMENTO DE VIAGENS (🔵 Simulação Local)
// ═══════════════════════════════════════════════════════════════════
console.log('🔵 Bloco 1: Isolamento de Viagens e Dados Privados (Simulação)');

const tripsForA = db.selectTrips(userA.id);
assert(!tripsForA.some((t) => t.id === tripB.id), 'Conta A NÃO tem acesso aos dados da Viagem B');

const tripsForBBefore = db.selectTrips(userB.id);
assert(!tripsForBBefore.some((t) => t.id === tripA.id), 'Conta B NÃO acessa Viagem A antes de aceitar convite');

const tripsForC = db.selectTrips(userC.id);
assert(tripsForC.length === 0, 'Conta C tem ZERO acesso às viagens de A ou B');

const expensesOfBSeenByC = db.selectExpenses(userC.id, tripB.id);
const expensesOfBSeenByA = db.selectExpenses(userA.id, tripB.id);
assert(
  expensesOfBSeenByC.length === 0 && expensesOfBSeenByA.length === 0,
  'Despesas da Viagem B são inacessíveis para Conta A e Conta C'
);

// ═══════════════════════════════════════════════════════════════════
// BLOCO 2: PROTEÇÃO DE PAPÉIS E COUPLE_ID (🔵 Simulação Local)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🔵 Bloco 2: Proteção de Papéis, couple_id e IS DISTINCT FROM (Simulação)');

// B entra na viagem A como member
const inviteResult1 = db.getOrCreateInvite(userA.id, tripA.id);
const membershipBInA = db.acceptInvitation(userB.id, tripA.id, inviteResult1.token);
assert(membershipBInA.role === 'member', 'Conta B entrou na Viagem A como "member"');

// Cenário: autopromoção a admin
let blockedSelfPromotion = false;
try {
  db.updateMember(userB.id, membershipBInA.id, { role: 'admin' });
} catch (err) {
  blockedSelfPromotion = err.message.includes('apenas a administradora pode alterar papéis');
}
assert(blockedSelfPromotion, 'Trigger BLOQUEIA autopromoção de member para admin');

// Cenário: alteração de couple_id por não-admin
let blockedCoupleIdChange = false;
try {
  db.updateMember(userB.id, membershipBInA.id, { couple_id: 'couple-malicioso-999' });
} catch (err) {
  blockedCoupleIdChange = err.message.includes('apenas a administradora pode alterar o vínculo de casal');
}
assert(blockedCoupleIdChange, 'Trigger BLOQUEIA alteração de couple_id por não-admin');

// Cenário: couple_id null → null NÃO dispara erro (IS DISTINCT FROM)
let allowedNullToNull = true;
try {
  db.updateMember(userB.id, membershipBInA.id, { couple_id: null });
} catch (err) {
  allowedNullToNull = false;
}
assert(allowedNullToNull, 'IS DISTINCT FROM: null→null NÃO dispara exceção');

// Cenário: admin PODE alterar couple_id
let adminCanChangeCoupleId = true;
try {
  db.updateMember(userA.id, membershipBInA.id, { couple_id: 'couple-legit-123' });
} catch (err) {
  adminCanChangeCoupleId = false;
}
assert(adminCanChangeCoupleId, 'Administradora PODE alterar couple_id de participante');

// Cenário: admin PODE alterar role
let adminCanChangeRole = true;
try {
  db.updateMember(userA.id, membershipBInA.id, { role: 'member' });
} catch (err) {
  adminCanChangeRole = false;
}
assert(adminCanChangeRole, 'Administradora PODE alterar role de participante');

// ═══════════════════════════════════════════════════════════════════
// BLOCO 3: VALIDAÇÕES CRIPTOGRÁFICAS DE CONVITES (🔵 Simulação Local)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🔵 Bloco 3: Validações Criptográficas de Convites (Simulação)');

// Token forjado
let blockedInvalidInvite = false;
try {
  db.acceptInvitation(userC.id, tripA.id, 'token_inventado_falso_123');
} catch (err) {
  blockedInvalidInvite = err.message.includes('Convite inválido');
}
assert(blockedInvalidInvite, 'Token forjado é rejeitado com erro');

// Revogar e tentar usar
db.revokeInvite(userA.id, tripA.id);
const inviteResult1b = db.getOrCreateInvite(userA.id, tripA.id); // Gera novo pois o anterior foi revogado
const tokenBeforeRevoke = inviteResult1b.token;
db.revokeInvite(userA.id, tripA.id);
let blockedRevokedInvite = false;
try {
  db.acceptInvitation(userC.id, tripA.id, tokenBeforeRevoke);
} catch (err) {
  blockedRevokedInvite = err.message.includes('revogado pela administradora');
}
assert(blockedRevokedInvite, 'Token revogado é rejeitado');

// Token expirado
const expiredRaw = crypto.randomBytes(24).toString('hex');
const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');
db.invitations.push({
  id: 'inv-exp',
  trip_id: tripA.id,
  token_hash: expiredHash,
  expires_at: new Date(Date.now() - 1000).toISOString(),
  is_revoked: false,
});
let blockedExpiredInvite = false;
try {
  db.acceptInvitation(userC.id, tripA.id, expiredRaw);
} catch (err) {
  blockedExpiredInvite = err.message.includes('expirou');
}
assert(blockedExpiredInvite, 'Token expirado é rejeitado');

// UUID sem token
let blockedUuidOnly = false;
try {
  db.acceptInvitation(userC.id, tripA.id, null);
} catch (err) {
  blockedUuidOnly = err.message.includes('Token de convite inválido ou ausente');
}
assert(blockedUuidOnly, 'UUID sozinho sem token é bloqueado');

// Token válido permite entrar como member
const freshResult = db.regenerateInvite(userA.id, tripA.id);
const memberC = db.acceptInvitation(userC.id, tripA.id, freshResult.token);
assert(memberC.role === 'member', 'Token válido permite entrada estritamente como "member"');

// Token não existe no banco como texto puro (armazenado como hash)
assert(
  !db.invitations.some((i) => i.token_hash === freshResult.token),
  'Token original NÃO existe no banco; armazenado somente como hash SHA-256'
);

// Apenas admin pode gerar convite
let blockedNonAdminInviteGen = false;
try {
  db.getOrCreateInvite(userC.id, tripA.id);
} catch (err) {
  blockedNonAdminInviteGen = err.message.includes('Acesso negado');
}
assert(blockedNonAdminInviteGen, 'Participante comum é impedido de gerar convite');

// ═══════════════════════════════════════════════════════════════════
// BLOCO 4: REGENERAÇÃO DE CONVITES (🔵 Simulação Local)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🔵 Bloco 4: Regeneração de Convites (Simulação)');

// Gera convite para viagem B
const firstInvite = db.getOrCreateInvite(userB.id, tripB.id);
assert(firstInvite.is_new === true, 'Primeiro convite gerado retorna is_new=true');
assert(firstInvite.token !== null, 'Primeiro convite retorna token em texto puro');

// Segunda chamada: convite ativo já existe → retorna is_new=false
const secondCall = db.getOrCreateInvite(userB.id, tripB.id);
assert(secondCall.is_new === false, 'Segunda chamada retorna is_new=false (convite já ativo)');
assert(secondCall.token === null, 'Segunda chamada retorna token=null (não é recuperável)');

// Regenerar: revoga anterior e gera novo
const regenResult = db.regenerateInvite(userB.id, tripB.id);
assert(regenResult.token !== null, 'Regeneração retorna novo token em texto puro');
assert(regenResult.token !== firstInvite.token, 'Novo token é diferente do original');

// Token antigo não funciona mais
let oldTokenBlocked = false;
try {
  const testUser = { id: 'usr-test-regen' };
  db.acceptInvitation(testUser.id, tripB.id, firstInvite.token);
} catch (err) {
  oldTokenBlocked = err.message.includes('revogado') || err.message.includes('inválido');
}
assert(oldTokenBlocked, 'Token anterior é invalidado após regeneração');

// Novo token funciona
const testUser2 = { id: 'usr-test-regen-2' };
const regenAccept = db.acceptInvitation(testUser2.id, tripB.id, regenResult.token);
assert(regenAccept.role === 'member', 'Token regenerado permite entrada como member');

// ═══════════════════════════════════════════════════════════════════
// BLOCO 5: FALLBACK SEM SUPABASE (🟢 Análise Estática do TypeScript)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🟢 Bloco 5: Fallback sem Supabase (Análise Estática do código)');

// Verificar que acceptTripInvitation NÃO simula sucesso sem Supabase
const acceptFn = memberServiceTs.substring(
  memberServiceTs.indexOf('async acceptTripInvitation'),
  memberServiceTs.indexOf('// Supabase RPC com validação estrita de token')
);
assert(
  acceptFn.includes('throw new Error') && acceptFn.includes('Supabase não está configurado'),
  'acceptTripInvitation lança erro quando Supabase não está configurado'
);

// Verificar getOrCreateTripInvite
const getOrCreateFn = memberServiceTs.substring(
  memberServiceTs.indexOf('async getOrCreateTripInvite'),
  memberServiceTs.indexOf('async regenerateTripInvite')
);
assert(
  getOrCreateFn.includes('throw new Error') && getOrCreateFn.includes('Supabase não está configurado'),
  'getOrCreateTripInvite lança erro quando Supabase não está configurado'
);

// Verificar regenerateTripInvite
const regenFn = memberServiceTs.substring(
  memberServiceTs.indexOf('async regenerateTripInvite'),
  memberServiceTs.indexOf('async revokeTripInvite')
);
assert(
  regenFn.includes('throw new Error') && regenFn.includes('Supabase não está configurado'),
  'regenerateTripInvite lança erro quando Supabase não está configurado'
);

// Verificar revokeTripInvite
const revokeFn = memberServiceTs.substring(
  memberServiceTs.indexOf('async revokeTripInvite'),
  memberServiceTs.indexOf('async acceptTripInvitation')
);
assert(
  revokeFn.includes('throw new Error') && revokeFn.includes('Supabase não está configurado'),
  'revokeTripInvite lança erro quando Supabase não está configurado'
);

// Verificar que NÃO existe simulação de membros locais no acceptTripInvitation
assert(
  !acceptFn.includes('saveLocalMembers') && !acceptFn.includes('getLocalMembers'),
  'acceptTripInvitation NÃO simula persistência local de membros'
);

// ═══════════════════════════════════════════════════════════════════
// BLOCO 6: CASAIS E FK (🔵 Simulação Local)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🔵 Bloco 6: Casais e Integridade de FK (Simulação)');

const freshInviteCasal = db.regenerateInvite(userA.id, tripA.id);
const casalUser = { id: 'usr-casal-teste' };
db.acceptInvitation(casalUser.id, tripA.id, freshInviteCasal.token, true, 'Parceiro Sem Conta');
const coupleRecord = db.couples.find((c) => c.member_a_id === casalUser.id);
assert(
  coupleRecord && coupleRecord.member_b_id === null && coupleRecord.partner_name === 'Parceiro Sem Conta',
  'Casal criado com acompanhante pendente (member_b_id=NULL) sem violar FK'
);

// ═══════════════════════════════════════════════════════════════════
// BLOCO 7: AUDITORIA ESTÁTICA DO SQL (🟢 Análise Estática)
// ═══════════════════════════════════════════════════════════════════
console.log('\n🟢 Bloco 7: Auditoria Estática do SQL Consolidado');

// 7.1. Zero USING (true) em políticas RLS
const hasUsingTrueInPolicy = /CREATE\s+POLICY[\s\S]*?USING\s*\(\s*true\s*\)/i.test(consolidatedSql);
assert(!hasUsingTrueInPolicy, 'Zero ocorrências de USING (true) em políticas RLS');

// 7.2. Política de perfis escopada
assert(consolidatedSql.includes('profiles_select_scoped'), 'Política profiles_select_scoped está ativa');

// 7.3. Trigger de proteção presente
assert(consolidatedSql.includes('trigger_protect_trip_member_update'), 'Trigger trigger_protect_trip_member_update presente');

// 7.4. IS DISTINCT FROM no trigger
assert(consolidatedSql.includes('IS DISTINCT FROM'), 'Trigger usa IS DISTINCT FROM para comparações com NULL');

// 7.5. Proteção de couple_id no trigger
assert(
  consolidatedSql.includes("NEW.couple_id IS DISTINCT FROM OLD.couple_id"),
  'Trigger protege couple_id contra alteração por não-admin'
);

// 7.6. REVOKE ALL nas RPCs
assert(consolidatedSql.includes('REVOKE ALL ON FUNCTION public.accept_trip_invitation'), 'REVOKE ALL em accept_trip_invitation');
assert(consolidatedSql.includes('REVOKE ALL ON FUNCTION public.get_or_create_trip_invite'), 'REVOKE ALL em get_or_create_trip_invite');
assert(consolidatedSql.includes('REVOKE ALL ON FUNCTION public.is_trip_member'), 'REVOKE ALL em is_trip_member');
assert(consolidatedSql.includes('REVOKE ALL ON FUNCTION public.is_trip_admin'), 'REVOKE ALL em is_trip_admin');

// 7.7. search_path com pg_catalog
const searchPathMatches = consolidatedSql.match(/SET search_path\s*=\s*[^\n]+/g) || [];
const allUsePgCatalog = searchPathMatches.every(
  (sp) => sp.includes('pg_catalog')
);
assert(allUsePgCatalog, 'Todas as funções SECURITY DEFINER usam pg_catalog no search_path');

// 7.8. digest qualificado com extensions.digest
assert(consolidatedSql.includes('extensions.digest'), 'digest() qualificado explicitamente como extensions.digest');
assert(!consolidatedSql.match(/[^.]digest\s*\(/), 'Nenhuma chamada a digest() sem qualificação de schema');

// 7.9. Hashing SHA-256
assert(consolidatedSql.includes("'sha256'"), 'SQL utiliza hash SHA-256 para tokens');

// 7.10. Trigger de criação de viagem
assert(consolidatedSql.includes('CREATE TRIGGER on_trip_created'), 'Trigger on_trip_created presente');
assert(consolidatedSql.includes("'admin'") && consolidatedSql.includes("'confirmed'"), 'Trigger insere criador com role admin confirmado');

// 7.11. get_or_create_trip_invite não revoga convites existentes
const getOrCreateSql = consolidatedSql.substring(
  consolidatedSql.indexOf('CREATE OR REPLACE FUNCTION public.get_or_create_trip_invite'),
  consolidatedSql.indexOf('-- 6.2')
);
assert(
  !getOrCreateSql.includes('SET is_revoked = true'),
  'get_or_create_trip_invite NÃO revoga convites existentes ao ser chamada'
);

// 7.12. Idempotência — CREATE TABLE IF NOT EXISTS
const tableCreations = (consolidatedSql.match(/CREATE TABLE/g) || []).length;
const tableIfNotExists = (consolidatedSql.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
assert(
  tableCreations === tableIfNotExists,
  `Todas as tabelas usam IF NOT EXISTS (${tableIfNotExists}/${tableCreations})`
);

// 7.13. Idempotência — DROP TRIGGER IF EXISTS antes de CREATE TRIGGER
const triggerCreations = (consolidatedSql.match(/CREATE TRIGGER/g) || []).length;
const triggerDrops = (consolidatedSql.match(/DROP TRIGGER IF EXISTS/g) || []).length;
assert(
  triggerDrops >= triggerCreations,
  `DROP TRIGGER IF EXISTS antes de cada CREATE TRIGGER (${triggerDrops}/${triggerCreations})`
);

// 7.14. Idempotência — DROP POLICY IF EXISTS antes de CREATE POLICY
const policyCreations = (consolidatedSql.match(/CREATE POLICY/g) || []).length;
const policyDrops = (consolidatedSql.match(/DROP POLICY IF EXISTS/g) || []).length;
assert(
  policyDrops >= policyCreations,
  `DROP POLICY IF EXISTS antes de cada CREATE POLICY (${policyDrops}/${policyCreations})`
);

// 7.15. Idempotência — CREATE INDEX IF NOT EXISTS
const indexCreations = (consolidatedSql.match(/CREATE INDEX/g) || []).length;
const indexIfNotExists = (consolidatedSql.match(/CREATE INDEX IF NOT EXISTS/g) || []).length;
assert(
  indexCreations === indexIfNotExists,
  `Todos os índices usam IF NOT EXISTS (${indexIfNotExists}/${indexCreations})`
);

// 7.16. Idempotência — Backfill com ON CONFLICT DO NOTHING
assert(
  consolidatedSql.includes('ON CONFLICT (id) DO NOTHING'),
  'Backfill de profiles usa ON CONFLICT (id) DO NOTHING'
);

// 7.17. Idempotência — UNIQUE constraint idempotente para token_hash
assert(
  consolidatedSql.includes('invitations_token_hash_unique'),
  'Constraint UNIQUE para token_hash criada de forma idempotente'
);

// ═══════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`🎯 RESULTADO FINAL: ${passed}/${total} testes aprovados (${((passed / total) * 100).toFixed(1)}%)`);

if (failed.length > 0) {
  console.log('\n❌ Testes que falharam:');
  failed.forEach((f) => console.log(`   • ${f}`));
}

console.log('\n📋 Classificação:');
console.log('   🔵 Simulação Local = Lógica comprovada via Mock Engine JavaScript');
console.log('   🟢 Análise Estática = Validação por leitura do código-fonte');
console.log('   🔴 Integração Real = NÃO implementado (requer PostgreSQL/Supabase real)');
console.log('═══════════════════════════════════════════════════════════════\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
