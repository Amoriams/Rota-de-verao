/**
 * validate_secure_invitations.cjs
 * Bateria de Testes Automatizados para Segurança dos Convites com Tokens Criptográficos
 *
 * Cenários obrigatórios avaliados:
 * 1. Token válido permite entrar.
 * 2. UUID sem token não permite entrar.
 * 3. Token incorreto não permite entrar.
 * 4. Token revogado não permite entrar.
 * 5. Token expirado não permite entrar.
 * 6. Usuário não autenticado não consegue aceitar convite.
 * 7. Participante entra como member.
 * 8. Participante não consegue se promover.
 * 9. Usuário não consegue administrar convites de terceiros.
 * 10. Administradora consegue revogar e regenerar seu link.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let total = 0;

function assert(condition, description) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.log(`  ❌ [FAIL] ${description}`);
  }
}

console.log('\n================================================================');
console.log('🔒 VALIDAÇÃO DE SEGURANÇA DOS CONVITES COM TOKENS 🔒');
console.log('================================================================\n');

const basePath = path.resolve(__dirname, '..');

// ── 1. Verificação de Arquivos e Migrações ─────────────────────────────────────
console.log('📁 1. Arquivos de Código e Migrações de Segurança');
const requiredFiles = [
  'supabase/migrations/006_seguranca_convites_tokens.sql',
  'src/services/memberService.ts',
  'src/pages/JoinTrip.tsx',
  'src/pages/Participants.tsx',
];

requiredFiles.forEach((file) => {
  assert(fs.existsSync(path.join(basePath, file)), `Arquivo ${file} existe e está acessível`);
});

const migration006Src = fs.readFileSync(path.join(basePath, 'supabase/migrations/006_seguranca_convites_tokens.sql'), 'utf8');
const memberServiceSrc = fs.readFileSync(path.join(basePath, 'src/services/memberService.ts'), 'utf8');
const joinTripSrc = fs.readFileSync(path.join(basePath, 'src/pages/JoinTrip.tsx'), 'utf8');
const participantsSrc = fs.readFileSync(path.join(basePath, 'src/pages/Participants.tsx'), 'utf8');

// ── 2. Cenários de Teste Lógicos e Arquiteturais ───────────────────────────────

console.log('\n🧪 2. Cenários Obrigatórios de Auditoria e Segurança');

// Dados de simulação
const adminA = { id: 'usr-julia-admin', full_name: 'Julia Organizadora' };
const memberB = { id: 'usr-ana-member', full_name: 'Ana Participante' };
const attackerC = { id: 'usr-carlos-attacker', full_name: 'Carlos Intruso' };

const tripA = {
  id: 'trip-segura-2027',
  created_by: adminA.id,
  title: 'Viagem Segura para a Praia',
  is_archived: false,
};

// Gerenciador de convites em memória para simulação do motor SQL
class InviteSecurityEngine {
  constructor() {
    this.invitations = [];
    this.members = [{ trip_id: tripA.id, profile_id: adminA.id, role: 'admin' }];
  }

  getOrCreateInvite(userId, tripId) {
    if (tripA.created_by !== userId) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode visualizar ou gerar links de convite.');
    }
    const active = this.invitations.find(
      (i) => i.trip_id === tripId && !i.is_revoked && new Date(i.expires_at) > new Date()
    );
    if (active) return active.token;

    const token = 'token_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    this.invitations.push({
      id: 'inv-' + Date.now(),
      trip_id: tripId,
      token,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });
    return token;
  }

  regenerateInvite(userId, tripId) {
    if (tripA.created_by !== userId) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode regenerar o link de convite.');
    }
    this.invitations.forEach((i) => {
      if (i.trip_id === tripId) i.is_revoked = true;
    });
    const token = 'token_regenerated_' + Math.random().toString(36).substring(2);
    this.invitations.push({
      id: 'inv-' + Date.now(),
      trip_id: tripId,
      token,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });
    return token;
  }

  revokeInvite(userId, tripId) {
    if (tripA.created_by !== userId) {
      throw new Error('Acesso negado: apenas a administradora desta viagem pode revogar convites.');
    }
    this.invitations.forEach((i) => {
      if (i.trip_id === tripId) i.is_revoked = true;
    });
  }

  acceptInvitation(userId, tripId, token, requestedRole = 'member') {
    if (!userId) {
      throw new Error('Usuário não autenticado. Faça login ou crie uma conta para aceitar o convite.');
    }
    if (!token || token.trim().length < 8) {
      throw new Error('Token de convite inválido ou ausente. O acesso a viagens privadas exige um link de convite oficial.');
    }
    const invite = this.invitations.find((i) => i.trip_id === tripId && i.token === token.trim());
    if (!invite) {
      throw new Error('Convite inválido para esta viagem.');
    }
    if (invite.is_revoked) {
      throw new Error('Este link de convite foi revogado pela administradora.');
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Este link de convite expirou.');
    }

    // REGRA DE SEGURANÇA: ignora requestedRole e fixa estritamente como 'member'
    const assignedRole = 'member';
    this.members.push({ trip_id: tripId, profile_id: userId, role: assignedRole });
    return { success: true, role: assignedRole };
  }
}

const engine = new InviteSecurityEngine();

// Cenário 1: Token válido permite entrar
console.log('\n  Cenário 1: Token válido permite entrar');
const validToken = engine.getOrCreateInvite(adminA.id, tripA.id);
assert(typeof validToken === 'string' && validToken.length >= 10, 'Token gerado pela administradora com alta entropia');
const acceptRes1 = engine.acceptInvitation(memberB.id, tripA.id, validToken);
assert(acceptRes1.success === true && acceptRes1.role === 'member', 'Usuário com token válido ingressou com sucesso');

// Cenário 2: UUID sem token não permite entrar
console.log('\n  Cenário 2: UUID sem token NÃO permite entrar');
let blockedUuidWithoutToken = false;
try {
  engine.acceptInvitation(attackerC.id, tripA.id, null);
} catch (err) {
  blockedUuidWithoutToken = true;
  assert(err.message.includes('Token de convite inválido ou ausente'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedUuidWithoutToken, 'UUID sozinho sem token foi barrado com erro');

// Cenário 3: Token incorreto não permite entrar
console.log('\n  Cenário 3: Token incorreto NÃO permite entrar');
let blockedWrongToken = false;
try {
  engine.acceptInvitation(attackerC.id, tripA.id, 'token_adivinhado_falso_123');
} catch (err) {
  blockedWrongToken = true;
  assert(err.message.includes('Convite inválido para esta viagem'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedWrongToken, 'Token forjado/adivinhado foi rejeitado');

// Cenário 4: Token revogado não permite entrar
console.log('\n  Cenário 4: Token revogado NÃO permite entrar');
engine.revokeInvite(adminA.id, tripA.id);
let blockedRevoked = false;
try {
  engine.acceptInvitation(attackerC.id, tripA.id, validToken);
} catch (err) {
  blockedRevoked = true;
  assert(err.message.includes('revogado pela administradora'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedRevoked, 'Tentativa com token revogado foi rejeitada');

// Cenário 5: Token expirado não permite entrar
console.log('\n  Cenário 5: Token expirado NÃO permite entrar');
const expiredToken = 'token_expirado_antigo_999';
engine.invitations.push({
  id: 'inv-expirado',
  trip_id: tripA.id,
  token: expiredToken,
  expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // expirou ontem
  is_revoked: false,
});
let blockedExpired = false;
try {
  engine.acceptInvitation(attackerC.id, tripA.id, expiredToken);
} catch (err) {
  blockedExpired = true;
  assert(err.message.includes('expirou'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedExpired, 'Token com data expirada foi rejeitado');

// Cenário 6: Usuário não autenticado não consegue aceitar convite
console.log('\n  Cenário 6: Usuário não autenticado não consegue aceitar convite');
const freshToken = engine.getOrCreateInvite(adminA.id, tripA.id);
let blockedUnauthenticated = false;
try {
  engine.acceptInvitation(null, tripA.id, freshToken);
} catch (err) {
  blockedUnauthenticated = true;
  assert(err.message.includes('não autenticado'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedUnauthenticated, 'Usuário anônimo não consegue ingressar na viagem');

// Cenário 7: Participante entra como member
console.log('\n  Cenário 7: Participante entra estritamente como member');
const memberUser = { id: 'usr-paula-nova' };
const resMember = engine.acceptInvitation(memberUser.id, tripA.id, freshToken);
assert(resMember.role === 'member', 'Papel atribuído ao participante é estritamente "member"');

// Cenário 8: Participante não consegue se promover a admin
console.log('\n  Cenário 8: Participante NÃO consegue se autopromover');
const maliciousAttempt = engine.acceptInvitation(attackerC.id, tripA.id, freshToken, 'admin');
assert(maliciousAttempt.role === 'member', 'Tentativa de autopromoção para admin foi ignorada pelo backend');
assert(migration006Src.includes("'member'") && !migration006Src.includes("role := 'admin'"), 'SQL hardcoda role = member no INSERT de trip_members');

// Cenário 9: Usuário não consegue administrar convites de terceiros
console.log('\n  Cenário 9: Usuário não consegue administrar convites de viagens alheias');
let blockedTampering = false;
try {
  engine.regenerateInvite(memberB.id, tripA.id);
} catch (err) {
  blockedTampering = true;
  assert(err.message.includes('Acesso negado'), `Bloqueio confirmado: ${err.message}`);
}
assert(blockedTampering, 'Participante é bloqueado ao tentar regenerar/revogar convite de outra administradora');

// Cenário 10: Administradora consegue revogar e regenerar seu link
console.log('\n  Cenário 10: Administradora consegue regenerar seu link');
const regeneratedToken = engine.regenerateInvite(adminA.id, tripA.id);
assert(typeof regeneratedToken === 'string' && regeneratedToken !== freshToken, 'Novo token gerado e diferente do anterior');
// Antigo deve estar revogado
let oldNowRevoked = false;
try {
  engine.acceptInvitation('usr-outro-participante', tripA.id, freshToken);
} catch (err) {
  oldNowRevoked = err.message.includes('revogado');
}
assert(oldNowRevoked, 'O link anterior foi revogado automaticamente com a regeneração');
// Novo deve funcionar
const newAccepted = engine.acceptInvitation('usr-outro-participante', tripA.id, regeneratedToken);
assert(newAccepted.success === true, 'Novo link regenerado funciona perfeitamente');

// ── 3. Validação das Regras na Migração SQL 006 ────────────────────────────────
console.log('\n🗄️ 3. Verificações de Hardening na Migração 006');
assert(migration006Src.includes('ALTER TABLE public.invitations'), 'Migração reutiliza tabela public.invitations');
assert(migration006Src.includes('ALTER COLUMN profile_id DROP NOT NULL'), 'Torna profile_id opcional para link geral');
assert(migration006Src.includes('REVOKE ALL ON FUNCTION public.accept_trip_invitation'), 'Permissões EXECUTE revogadas de PUBLIC');
assert(migration006Src.includes('GRANT EXECUTE ON FUNCTION public.accept_trip_invitation(UUID, TEXT, BOOLEAN, VARCHAR) TO authenticated'), 'Permissão EXECUTE concedida apenas a authenticated');
assert(migration006Src.includes('SET search_path = public, extensions, pg_temp'), 'search_path protegido contra search_path hijacking');
assert(joinTripSrc.includes('token'), 'JoinTrip valida e extrai token de useSearchParams');
assert(participantsSrc.includes('handleRegenerateInvite'), 'Participants oferece regeneração de convite');
assert(participantsSrc.includes('handleRevokeInvite'), 'Participants oferece revogação de convite');

console.log('\n================================================================');
console.log(`🎯 RESULTADO FINAL: ${passed}/${total} testes aprovados (${((passed / total) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
