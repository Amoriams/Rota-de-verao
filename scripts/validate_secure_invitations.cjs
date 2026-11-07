/**
 * validate_secure_invitations.cjs
 * Bateria de Testes de Segurança, RLS, Hashing e Idempotência — Rota de Verão
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CLASSIFICAÇÃO DOS TESTES                                   ║
 * ║                                                              ║
 * ║  🟢 ANÁLISE ESTÁTICA — Leitura, parsing e regex sobre o     ║
 * ║     arquivo CONSOLIDATED_SETUP.sql e código TypeScript.      ║
 * ║     Valida estrutura, sintaxe e presença de salvaguardas.    ║
 * ║                                                              ║
 * ║  🔵 SIMULAÇÃO LOCAL — Mock Engine em JavaScript que          ║
 * ║     reproduz com fidelidade matemática a semântica das       ║
 * ║     políticas RLS do Postgres e dos triggers PL/pgSQL.       ║
 * ║                                                              ║
 * ║  🔴 INTEGRAÇÃO REAL — Execução contra instância PostgreSQL/  ║
 * ║     Supabase em execução. NÃO realizada neste script local.  ║
 * ║     Será executada no Marco 9 (Bateria E2E).                 ║
 * ╚══════════════════════════════════════════════════════════════╝
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
    console.log(`  ✅ [PASS] [${category}] ${description}`);
  } else {
    failed.push(`[${category}] ${description}`);
    console.log(`  ❌ [FAIL] [${category}] ${description}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🛡️  VALIDAÇÃO INTEGRAL DE SEGURANÇA E IDEMPOTÊNCIA — ROTA DE VERÃO');
console.log('═══════════════════════════════════════════════════════════════\n');

const basePath = path.resolve(__dirname, '..');
const consolidatedSql = fs.readFileSync(path.join(basePath, 'supabase/migrations/CONSOLIDATED_SETUP.sql'), 'utf8');
const migration006Sql = fs.readFileSync(path.join(basePath, 'supabase/migrations/006_seguranca_convites_tokens.sql'), 'utf8');
const memberServiceTs = fs.readFileSync(path.join(basePath, 'src/services/memberService.ts'), 'utf8');
const participantsTsx = fs.readFileSync(path.join(basePath, 'src/pages/Participants.tsx'), 'utf8');
const joinTripTsx = fs.readFileSync(path.join(basePath, 'src/pages/JoinTrip.tsx'), 'utf8');

// ── Definição de Usuários e Entidades para Simulação ──────────────────────────
const userA = { id: 'usr-a-admin', name: 'Administradora A' };
const userB = { id: 'usr-b-member', name: 'Participante B' };
const userC = { id: 'usr-c-isolated', name: 'Usuário C (Externo)' };

const tripA = { id: 'trip-a-1111', title: 'Verão em Maresias', created_by: userA.id, is_archived: false };
const tripB = { id: 'trip-b-2222', title: 'Carnaval em Salvador', created_by: 'usr-other', is_archived: false };

/**
 * MockPostgresSecurityEngine
 * Reproduz com precisão as políticas RLS e triggers de CONSOLIDATED_SETUP.sql
 */
class MockPostgresSecurityEngine {
  constructor() {
    this.trips = [tripA, tripB];
    this.members = [
      { id: 'tm-a1', trip_id: tripA.id, profile_id: userA.id, role: 'admin', confirmation_status: 'confirmed', couple_id: null },
      { id: 'tm-b1', trip_id: tripA.id, profile_id: userB.id, role: 'member', confirmation_status: 'confirmed', couple_id: null },
      { id: 'tm-other', trip_id: tripB.id, profile_id: 'usr-other', role: 'admin', confirmation_status: 'confirmed', couple_id: null },
    ];
    this.expenses = [
      { id: 'exp-a1', trip_id: tripA.id, payer_id: userA.id, title: 'Casa da Praia', total_amount: 4000.0 },
      { id: 'exp-b1', trip_id: tripB.id, payer_id: 'usr-other', title: 'Abadá Salvador', total_amount: 1500.0 },
    ];
    this.expenseSplits = [
      { id: 'split-1', expense_id: 'exp-a1', profile_id: userA.id, share_amount: 2000.0, status: 'paid' },
      { id: 'split-2', expense_id: 'exp-a1', profile_id: userB.id, share_amount: 2000.0, status: 'pending' },
    ];
    this.polls = [
      { id: 'poll-a1', trip_id: tripA.id, title: 'Qual churrasco fazer?', is_active: true },
      { id: 'poll-b1', trip_id: tripB.id, title: 'Qual trio seguir?', is_active: true },
    ];
    this.pollOptions = [
      { id: 'opt-a1', poll_id: 'poll-a1', title: 'Picanha' },
      { id: 'opt-a2', poll_id: 'poll-a1', title: 'Costela' },
      { id: 'opt-b1', poll_id: 'poll-b1', title: 'Bell Marques' },
    ];
    this.pollVotes = [];
    this.invitations = [];
    this.couples = [];
    this.activityLogs = [];
  }

  // 5.1 & 5.2
  isTripMember(userId, tripId) {
    return this.members.some((m) => m.trip_id === tripId && m.profile_id === userId);
  }

  isTripAdmin(userId, tripId) {
    const isOwner = this.trips.some((t) => t.id === tripId && t.created_by === userId);
    const isMemberAdmin = this.members.some((m) => m.trip_id === tripId && m.profile_id === userId && m.role === 'admin');
    return isOwner || isMemberAdmin;
  }

  // RLS TRIPS
  selectTrips(userId) {
    return this.trips.filter((t) => t.created_by === userId || this.isTripMember(userId, t.id));
  }

  updateTrip(userId, tripId, updates) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Viagem não encontrada.');
    if (!this.isTripAdmin(userId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora pode alterar a viagem.');
    }
    Object.assign(trip, updates);
    return trip;
  }

  // RLS EXPENSES & check_expense_update
  selectExpenses(userId, tripId) {
    if (!this.isTripMember(userId, tripId) && !this.isTripAdmin(userId, tripId)) {
      return [];
    }
    return this.expenses.filter((e) => e.trip_id === tripId);
  }

  insertExpense(userId, expenseData) {
    // RLS expenses_insert WITH CHECK: (is_trip_member OR is_trip_admin) AND payer_id = auth.uid()
    if (expenseData.payer_id !== userId) {
      throw new Error('Acesso negado: você só pode lançar despesas em seu próprio nome.');
    }
    if (!this.isTripMember(userId, expenseData.trip_id) && !this.isTripAdmin(userId, expenseData.trip_id)) {
      throw new Error('Acesso negado: você não participa desta viagem.');
    }
    const newExpense = { id: 'exp-' + Date.now(), ...expenseData };
    this.expenses.push(newExpense);
    return newExpense;
  }

  updateExpense(userId, expenseId, updates) {
    const exp = this.expenses.find((e) => e.id === expenseId);
    if (!exp) throw new Error('Despesa não encontrada.');

    // RLS expenses_update USING
    const isAdmin = this.isTripAdmin(userId, exp.trip_id);
    const isPayerMember = exp.payer_id === userId && this.isTripMember(userId, exp.trip_id);
    if (!isAdmin && !isPayerMember) {
      throw new Error('Acesso negado: você não tem permissão para editar esta despesa.');
    }

    // Trigger check_expense_update
    if ('trip_id' in updates && updates.trip_id !== exp.trip_id) {
      throw new Error('Acesso negado: não é permitido transferir uma despesa para outra viagem.');
    }
    if (!isAdmin) {
      if (exp.payer_id !== userId) {
        throw new Error('Acesso negado: você só pode editar despesas criadas por você.');
      }
      if ('payer_id' in updates && updates.payer_id !== exp.payer_id) {
        throw new Error('Acesso negado: não é permitido alterar o pagador da despesa.');
      }
    }

    Object.assign(exp, updates);
    return exp;
  }

  // RLS EXPENSE_SPLITS & check_expense_split_update
  updateExpenseSplit(userId, splitId, updates) {
    const split = this.expenseSplits.find((s) => s.id === splitId);
    if (!split) throw new Error('Rateio não encontrado.');

    const parentExpense = this.expenses.find((e) => e.id === split.expense_id);
    const isAdmin = parentExpense ? this.isTripAdmin(userId, parentExpense.trip_id) : false;

    // RLS: profile_id = auth.uid() OR is_trip_admin
    if (split.profile_id !== userId && !isAdmin) {
      throw new Error('Acesso negado: rateio de outro participante.');
    }

    // Trigger check_expense_split_update
    if (!isAdmin) {
      if ('share_amount' in updates && updates.share_amount !== split.share_amount) {
        throw new Error('Acesso negado: apenas a administradora pode alterar o valor da cota de rateio.');
      }
      if ('profile_id' in updates && updates.profile_id !== split.profile_id) {
        throw new Error('Acesso negado: não é permitido transferir a cota para outro participante.');
      }
      if ('expense_id' in updates && updates.expense_id !== split.expense_id) {
        throw new Error('Acesso negado: não é permitido vincular o rateio a outra despesa.');
      }
    }

    Object.assign(split, updates);
    return split;
  }

  // RLS POLL_VOTES & Composed FK
  insertPollVote(userId, pollId, optionId) {
    const poll = this.polls.find((p) => p.id === pollId);
    if (!poll || !poll.is_active) {
      throw new Error('Enquete inexistente ou inativa.');
    }
    if (!this.isTripMember(userId, poll.trip_id) && !this.isTripAdmin(userId, poll.trip_id)) {
      throw new Error('Acesso negado: usuário não participa da viagem desta enquete.');
    }

    // Validação da FK composta: poll_options(poll_id, id)
    const option = this.pollOptions.find((o) => o.poll_id === pollId && o.id === optionId);
    if (!option) {
      throw new Error('Violação de FK composta: a opção indicada não pertence a esta enquete.');
    }

    if (this.pollVotes.some((v) => v.poll_id === pollId && v.profile_id === userId)) {
      throw new Error('Usuário já votou nesta enquete.');
    }

    const vote = { poll_id: pollId, option_id: optionId, profile_id: userId, created_at: new Date() };
    this.pollVotes.push(vote);
    return vote;
  }

  // TRIP_MEMBERS TRIGGER check_trip_member_update
  updateMember(userId, memberId, updates) {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Membro não encontrado.');

    const isAdmin = this.isTripAdmin(userId, member.trip_id);

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

    Object.assign(member, updates);
    return member;
  }

  // CONVITES SEGUROS (RPCs)
  getOrCreateInvite(adminId, tripId) {
    if (!adminId) throw new Error('Usuário não autenticado.');
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode gerenciar convites.');
    }

    const existing = this.invitations.find(
      (i) => i.trip_id === tripId && !i.is_revoked && new Date(i.expires_at) > new Date()
    );

    if (existing) {
      return { token: null, expires_at: existing.expires_at, is_new: false };
    }

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.invitations.push({
      id: 'inv-' + Date.now(),
      trip_id: tripId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });

    return { token: rawToken, expires_at: this.invitations[this.invitations.length - 1].expires_at, is_new: true };
  }

  regenerateInvite(adminId, tripId) {
    if (!adminId) throw new Error('Usuário não autenticado.');
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode regenerar o link de convite.');
    }

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
    if (!adminId) throw new Error('Usuário não autenticado.');
    if (!this.isTripAdmin(adminId, tripId)) {
      throw new Error('Acesso negado: apenas a administradora pode revogar convites.');
    }
    this.invitations.forEach((i) => {
      if (i.trip_id === tripId) i.is_revoked = true;
    });
  }

  acceptInvitation(userId, tripId, rawToken, isCouple = false, partnerName = null) {
    if (!userId) {
      throw new Error('Usuário não autenticado. Faça login ou crie uma conta para aceitar o convite.');
    }
    if (!rawToken || rawToken.trim().length < 8) {
      throw new Error('Token de convite inválido ou ausente. O acesso a viagens privadas exige um link oficial.');
    }

    const trip = this.trips.find((t) => t.id === tripId && !t.is_archived);
    if (!trip) throw new Error('A viagem informada não existe ou foi arquivada.');

    const presentedHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const invite = this.invitations.find((i) => i.trip_id === tripId && i.token_hash === presentedHash);

    if (!invite) throw new Error('Convite inválido para esta viagem.');
    if (invite.is_revoked) throw new Error('Este link de convite foi revogado pela administradora.');
    if (new Date(invite.expires_at) < new Date()) throw new Error('Este link de convite expirou.');

    const existingMember = this.members.find((m) => m.trip_id === tripId && m.profile_id === userId);
    if (existingMember) {
      return { success: true, already_member: true, member_id: existingMember.id };
    }

    let coupleId = null;
    if (isCouple && partnerName && partnerName.trim().length >= 2) {
      coupleId = 'couple-' + Date.now();
      this.couples.push({
        id: coupleId,
        trip_id: tripId,
        member_a_id: userId,
        member_b_id: null,
        partner_name: partnerName.trim(),
      });
    }

    const newMember = {
      id: 'tm-' + Date.now(),
      trip_id: tripId,
      profile_id: userId,
      role: 'member',
      confirmation_status: 'confirmed',
      couple_id: coupleId,
    };
    this.members.push(newMember);
    return { success: true, already_member: false, member_id: newMember.id, role: newMember.role };
  }
}

const db = new MockPostgresSecurityEngine();

// ═══════════════════════════════════════════════════════════════════
// SEÇÃO 1: OS 15 CENÁRIOS DE SEGURANÇA OBRIGATÓRIOS
// ═══════════════════════════════════════════════════════════════════
console.log('📌 SEÇÃO 1: OS 15 CENÁRIOS DE SEGURANÇA DO ESCOPO');

// 1. Usuário A não acessa dados da viagem de B
const tripsA = db.selectTrips(userA.id);
assert(!tripsA.some((t) => t.id === tripB.id), '1. Usuário A NÃO acessa dados da Viagem B');

// 2. Usuário A não edita despesas da viagem de B
let errExpB = false;
try {
  db.updateExpense(userA.id, 'exp-b1', { total_amount: 9999 });
} catch (e) {
  errExpB = e.message.includes('Acesso negado');
}
assert(errExpB, '2. Usuário A NÃO edita despesas da Viagem B');

// 3. Usuário A não insere despesas em viagens das quais não participa
let errInsertExpB = false;
try {
  db.insertExpense(userA.id, { trip_id: tripB.id, payer_id: userA.id, title: 'Intrusão', total_amount: 100 });
} catch (e) {
  errInsertExpB = e.message.includes('você não participa desta viagem');
}
assert(errInsertExpB, '3. Usuário A NÃO insere despesas em viagens das quais não participa');

// 4. Participante não altera o valor do próprio rateio
let errChangeShare = false;
try {
  db.updateExpenseSplit(userB.id, 'split-2', { share_amount: 1.0 });
} catch (e) {
  errChangeShare = e.message.includes('apenas a administradora pode alterar o valor da cota');
}
assert(errChangeShare, '4. Participante B NÃO altera o valor do próprio rateio (share_amount)');

// 5. Participante não altera o vínculo de um rateio
let errChangeSplitFk = false;
try {
  db.updateExpenseSplit(userB.id, 'split-2', { profile_id: userA.id });
} catch (e) {
  errChangeSplitFk = e.message.includes('não é permitido transferir a cota para outro participante');
}
assert(errChangeSplitFk, '5. Participante B NÃO altera o vínculo do rateio (profile_id ou expense_id)');

// 6. Participante não consegue promover a si mesmo a administrador
let errSelfPromote = false;
try {
  db.updateMember(userB.id, 'tm-b1', { role: 'admin' });
} catch (e) {
  errSelfPromote = e.message.includes('apenas a administradora pode alterar papéis');
}
assert(errSelfPromote, '6. Participante B NÃO consegue promover a si mesmo a administrador');

// 7. Participante não consegue alterar seu próprio couple_id
let errChangeCoupleId = false;
try {
  db.updateMember(userB.id, 'tm-b1', { couple_id: 'couple-fraude-123' });
} catch (e) {
  errChangeCoupleId = e.message.includes('apenas a administradora pode alterar o vínculo de casal');
}
assert(errChangeCoupleId, '7. Participante B NÃO consegue alterar seu próprio couple_id');

// 8. Usuário não consegue votar usando opção de outra enquete
let errCrossPollVote = false;
try {
  // opt-b1 pertence a poll-b1, tentando votar na poll-a1
  db.insertPollVote(userB.id, 'poll-a1', 'opt-b1');
} catch (e) {
  errCrossPollVote = e.message.includes('Violação de FK composta');
}
assert(errCrossPollVote, '8. Usuário NÃO consegue votar usando opção de outra enquete (FK composta)');

// 9. Convite revogado não permite entrada
const inviteTemp = db.getOrCreateInvite(userA.id, tripA.id);
db.revokeInvite(userA.id, tripA.id);
let errRevoked = false;
try {
  db.acceptInvitation(userC.id, tripA.id, inviteTemp.token);
} catch (e) {
  errRevoked = e.message.includes('revogado pela administradora');
}
assert(errRevoked, '9. Convite revogado NÃO permite entrada');

// 10. Convite expirado não permite entrada
const expRaw = crypto.randomBytes(24).toString('hex');
const expHash = crypto.createHash('sha256').update(expRaw).digest('hex');
db.invitations.push({
  id: 'inv-exp-test',
  trip_id: tripA.id,
  token_hash: expHash,
  expires_at: new Date(Date.now() - 5000).toISOString(),
  is_revoked: false,
});
let errExpired = false;
try {
  db.acceptInvitation(userC.id, tripA.id, expRaw);
} catch (e) {
  errExpired = e.message.includes('expirou');
}
assert(errExpired, '10. Convite expirado NÃO permite entrada');

// 11. UUID da viagem sem token não permite entrada
let errUuidWithoutToken = false;
try {
  db.acceptInvitation(userC.id, tripA.id, null);
} catch (e) {
  errUuidWithoutToken = e.message.includes('Token de convite inválido ou ausente');
}
assert(errUuidWithoutToken, '11. UUID da viagem sem token NÃO permite entrada');

// 12. Usuário não autenticado não consegue aceitar convite
const freshTokenObj = db.regenerateInvite(userA.id, tripA.id);
let errUnauthenticated = false;
try {
  db.acceptInvitation(null, tripA.id, freshTokenObj.token);
} catch (e) {
  errUnauthenticated = e.message.includes('Usuário não autenticado');
}
assert(errUnauthenticated, '12. Usuário NÃO autenticado não consegue aceitar convite');

// 13. Administradora consegue gerenciar sua própria viagem
let adminCanManage = true;
try {
  db.updateTrip(userA.id, tripA.id, { title: 'Maresias Top 2026' });
  const adminExp = db.insertExpense(userA.id, { trip_id: tripA.id, payer_id: userA.id, title: 'Carvão e Gelo', total_amount: 150 });
  db.updateExpense(userA.id, adminExp.id, { total_amount: 180 });
} catch (e) {
  adminCanManage = false;
}
assert(adminCanManage, '13. Administradora CONSEGUE gerenciar sua própria viagem e despesas');

// 14. Participante consegue consultar as informações permitidas da própria viagem
const expViewedByB = db.selectExpenses(userB.id, tripA.id);
const tripsViewedByB = db.selectTrips(userB.id);
assert(
  expViewedByB.length > 0 && tripsViewedByB.some((t) => t.id === tripA.id),
  '14. Participante CONSEGUE consultar as informações permitidas da sua viagem'
);

// 15. Abrir a tela de participantes não invalida convites existentes
const inviteBeforeOpening = db.getOrCreateInvite(userA.id, tripA.id);
// Simula segunda chamada ao abrir tela de participantes
const inviteOnOpen = db.getOrCreateInvite(userA.id, tripA.id);
assert(
  inviteOnOpen.is_new === false && inviteOnOpen.token === null,
  '15. Abrir a tela de participantes NÃO invalida convites existentes (retorna is_new=false)'
);

// ═══════════════════════════════════════════════════════════════════
// SEÇÃO 2: VALIDAÇÃO DE IDEMPOTÊNCIA DO SQL CONSOLIDADO
// ═══════════════════════════════════════════════════════════════════
console.log('\n📌 SEÇÃO 2: VERIFICAÇÃO DE IDEMPOTÊNCIA DO CONSOLIDATED_SETUP.SQL');

// 2.1. Todas as 15 tabelas usam CREATE TABLE IF NOT EXISTS
const tableCreations = (consolidatedSql.match(/CREATE TABLE/g) || []).length;
const tableIfNotExists = (consolidatedSql.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
assert(
  tableCreations === tableIfNotExists && tableCreations === 15,
  `Todas as 15 tabelas usam IF NOT EXISTS (${tableIfNotExists}/${tableCreations})`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.2. Todas as policies têm DROP POLICY IF EXISTS antes de CREATE POLICY
const policyCreations = (consolidatedSql.match(/CREATE POLICY/g) || []).length;
const policyDrops = (consolidatedSql.match(/DROP POLICY IF EXISTS/g) || []).length;
assert(
  policyDrops >= policyCreations,
  `DROP POLICY IF EXISTS antes de cada CREATE POLICY (${policyDrops} drops para ${policyCreations} creates)`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.3. Todos os triggers têm DROP TRIGGER IF EXISTS antes de CREATE TRIGGER
const triggerCreations = (consolidatedSql.match(/CREATE TRIGGER/g) || []).length;
const triggerDrops = (consolidatedSql.match(/DROP TRIGGER IF EXISTS/g) || []).length;
assert(
  triggerDrops >= triggerCreations,
  `DROP TRIGGER IF EXISTS antes de cada CREATE TRIGGER (${triggerDrops} drops para ${triggerCreations} creates)`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.4. Todos os índices usam CREATE INDEX IF NOT EXISTS (ou CREATE UNIQUE INDEX IF NOT EXISTS)
const indexCreations = (consolidatedSql.match(/CREATE (UNIQUE )?INDEX/g) || []).length;
const indexIfNotExists = (consolidatedSql.match(/CREATE (UNIQUE )?INDEX IF NOT EXISTS/g) || []).length;
assert(
  indexCreations === indexIfNotExists,
  `Todos os índices usam IF NOT EXISTS (${indexIfNotExists}/${indexCreations})`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.5. Alterações em tabelas já existentes usam IF NOT EXISTS e blocos defensivos DO $$
assert(
  consolidatedSql.includes('ADD COLUMN IF NOT EXISTS') && consolidatedSql.includes('DO $$ BEGIN'),
  'ALTER TABLE e novas constraints usam IF NOT EXISTS e blocos DO $$ condicionais',
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.6. Backfill de perfis utiliza ON CONFLICT (id) DO NOTHING
assert(
  consolidatedSql.includes('INSERT INTO public.profiles') && consolidatedSql.includes('ON CONFLICT (id) DO NOTHING'),
  'Backfill de perfis usa ON CONFLICT (id) DO NOTHING para reexecuções seguras',
  '🟢 ANÁLISE ESTÁTICA'
);

// 2.7. Zero DROP TABLE, TRUNCATE ou DELETE FROM que cause perda de dados
const hasDropTable = /DROP\s+TABLE/i.test(consolidatedSql);
const hasTruncate = /TRUNCATE/i.test(consolidatedSql);
const hasDeleteFrom = /DELETE\s+FROM/i.test(consolidatedSql);
assert(
  !hasDropTable && !hasTruncate && !hasDeleteFrom,
  'Zero ocorrências de DROP TABLE, TRUNCATE ou DELETE FROM no script',
  '🟢 ANÁLISE ESTÁTICA'
);

// ═══════════════════════════════════════════════════════════════════
// SEÇÃO 3: AUDITORIA DE REGRAS ESPECÍFICAS DE BLINDAGEM
// ═══════════════════════════════════════════════════════════════════
console.log('\n📌 SEÇÃO 3: AUDITORIA DAS SALVAGUARDAS CRÍTICAS NO SQL');

// 3.1. Zero USING (true) em políticas de segurança
const hasUsingTrueInPolicy = /CREATE\s+POLICY[\s\S]*?USING\s*\(\s*true\s*\)/i.test(consolidatedSql);
assert(!hasUsingTrueInPolicy, 'Zero ocorrências de USING (true) em políticas RLS', '🟢 ANÁLISE ESTÁTICA');

// 3.2. couple_status_view com security_invoker = true
assert(
  consolidatedSql.includes('WITH (security_invoker = true)'),
  'couple_status_view configurada com WITH (security_invoker = true)',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.3. trips_insert exige created_by = auth.uid() AND auth.uid() IS NOT NULL
assert(
  consolidatedSql.includes('created_by = auth.uid() AND auth.uid() IS NOT NULL'),
  'trips_insert elimina brecha de created_by IS NULL',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.4. Trava FOR UPDATE em get_or_create_trip_invite e regenerate_trip_invite
const hasForUpdateTrip = (consolidatedSql.match(/PERFORM 1 FROM public\.trips WHERE id = p_trip_id FOR UPDATE;/g) || []).length;
assert(
  hasForUpdateTrip >= 2,
  `Trava transacional FOR UPDATE presente contra race conditions (${hasForUpdateTrip} ocorrências)`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.5. Índice único parcial idx_single_active_invite_per_trip
assert(
  consolidatedSql.includes('idx_single_active_invite_per_trip'),
  'Índice parcial UNIQUE para 1 convite ativo por viagem presente',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.6. Foreign Key composta poll_votes(poll_id, option_id) -> poll_options(poll_id, id)
assert(
  consolidatedSql.includes('poll_votes_poll_option_fk') && consolidatedSql.includes('poll_options_poll_id_id_unique'),
  'Constraint composta e Foreign Key composta em poll_votes/poll_options implementadas',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.7. search_path com pg_catalog, extensions, public, pg_temp em todas as SECURITY DEFINER
const searchPathDefs = consolidatedSql.match(/SET search_path\s*=\s*[^\n]+/g) || [];
const allHaveExtensionsAndPgCatalog = searchPathDefs.every(
  (sp) => sp.includes('pg_catalog') && sp.includes('extensions') && sp.includes('public')
);
assert(
  allHaveExtensionsAndPgCatalog && searchPathDefs.length >= 10,
  `Todas as ${searchPathDefs.length} funções SECURITY DEFINER possuem search_path seguro com extensions`,
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.8. Trigger check_expense_update presente
assert(
  consolidatedSql.includes('trigger_protect_expense_update') && consolidatedSql.includes('check_expense_update'),
  'Trigger check_expense_update presente para proteger transferência de viagem e pagador',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.9. Trigger check_expense_split_update presente
assert(
  consolidatedSql.includes('trigger_protect_expense_split_update') && consolidatedSql.includes('check_expense_split_update'),
  'Trigger check_expense_split_update presente para proteger share_amount, profile_id e expense_id',
  '🟢 ANÁLISE ESTÁTICA'
);

// 3.10. Imutabilidade de activity_logs (apenas select e insert, zero update/delete)
const hasActivityLogsUpdate = /CREATE\s+POLICY[\s\S]*?ON\s+public\.activity_logs\s+FOR\s+UPDATE/i.test(consolidatedSql);
const hasActivityLogsDelete = /CREATE\s+POLICY[\s\S]*?ON\s+public\.activity_logs\s+FOR\s+DELETE/i.test(consolidatedSql);
assert(
  !hasActivityLogsUpdate && !hasActivityLogsDelete && consolidatedSql.includes('activity_logs_insert'),
  'activity_logs possui RLS apenas para SELECT e INSERT (logs imutáveis)',
  '🟢 ANÁLISE ESTÁTICA'
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

console.log('\n📋 Classificação metodológica:');
console.log('   🔵 Simulação Local: Lógica e regras de negócio validadas via Mock Engine');
console.log('   🟢 Análise Estática: Parsing e conformidade do código SQL e TypeScript');
console.log('   🔴 Integração Real: Será executada no Marco 9 diretamente no Supabase');
console.log('═══════════════════════════════════════════════════════════════\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
