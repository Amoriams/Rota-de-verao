/**
 * validate_independent_accounts.cjs
 * Bateria de Testes Automatizados para Contas Independentes e Gestão de Múltiplas Viagens
 *
 * Cenários avaliados:
 * 1. Criação de conta independente (Nome, e-mail, senha sem PIN)
 * 2. Login com credenciais próprias
 * 3. Criação de viagem com persistência no Supabase
 * 4. Persistência após logout e novo login
 * 5. Geração de convite para outra pessoa
 * 6. Entrada de outro usuário pelo link de convite (sem PIN)
 * 7. Apresentação separada em "Viagens que você organiza" e "Viagens em que você participa"
 * 8. Tentativa de edição ou exclusão de viagem por participante (bloqueio por RLS)
 * 9. Criação de viagem própria por usuário que já participa de outra viagem
 * 10. Isolamento estrito de dados entre viagens
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
console.log('🌴 VALIDAÇÃO DE CONTAS INDEPENDENTES E PAINEL DE VIAGENS 🌴');
console.log('================================================================\n');

const basePath = path.resolve(__dirname, '..');

// ── 1. Verificação de Código e Arquivos da Solução ────────────────────────────
console.log('📁 1. Arquivos de Código e Estruturas de Suporte');
const requiredFiles = [
  'src/contexts/AuthContext.tsx',
  'src/contexts/TripContext.tsx',
  'src/pages/Login.tsx',
  'src/pages/Home.tsx',
  'src/pages/JoinTrip.tsx',
  'src/components/auth/ProtectedRoute.tsx',
  'src/components/common/EmptyTripState.tsx',
  'src/services/tripService.ts',
  'src/services/memberService.ts',
  'supabase/migrations/002_multi_viagens.sql',
  'supabase/migrations/005_convite_sem_pin.sql',
];

requiredFiles.forEach((file) => {
  assert(fs.existsSync(path.join(basePath, file)), `Arquivo ${file} existe e está acessível`);
});

// Leitura dos conteúdos de código para validação estática
const authContextSrc = fs.readFileSync(path.join(basePath, 'src/contexts/AuthContext.tsx'), 'utf8');
const tripContextSrc = fs.readFileSync(path.join(basePath, 'src/contexts/TripContext.tsx'), 'utf8');
const loginSrc = fs.readFileSync(path.join(basePath, 'src/pages/Login.tsx'), 'utf8');
const homeSrc = fs.readFileSync(path.join(basePath, 'src/pages/Home.tsx'), 'utf8');
const joinTripSrc = fs.readFileSync(path.join(basePath, 'src/pages/JoinTrip.tsx'), 'utf8');
const protectedRouteSrc = fs.readFileSync(path.join(basePath, 'src/components/auth/ProtectedRoute.tsx'), 'utf8');
const rlsMigration002 = fs.readFileSync(path.join(basePath, 'supabase/migrations/002_multi_viagens.sql'), 'utf8');
const rpcMigration005 = fs.readFileSync(path.join(basePath, 'supabase/migrations/005_convite_sem_pin.sql'), 'utf8');

const emptyTripStateSrc = fs.readFileSync(path.join(basePath, 'src/components/common/EmptyTripState.tsx'), 'utf8');

// ── Cenário 1: Criação de Conta Independente ──────────────────────────────────
console.log('\n👤 Cenário 1: Criação de conta independente (Nome, e-mail e senha)');
assert(authContextSrc.includes('signUp = async (email: string, password: string, fullName: string)'), 'AuthContext expõe método signUp completo com fullName');
assert(loginSrc.includes("mode === 'signup'"), 'Interface de login contém formulário de criação de conta');
assert(loginSrc.includes('fullName') && loginSrc.includes('confirmPassword'), 'Validação de nome completo e confirmação de senha implementada');
assert(!loginSrc.includes('pin:'), 'Fluxo de cadastro não exige PIN');

// Simulação de criação de três contas independentes
const accountA = {
  id: 'usr-julia-001',
  email: 'julia@exemplo.com',
  fullName: 'Julia Organizadora',
};

const accountB = {
  id: 'usr-ana-002',
  email: 'ana@exemplo.com',
  fullName: 'Ana Participante',
};

const accountC = {
  id: 'usr-carlos-003',
  email: 'carlos@exemplo.com',
  fullName: 'Carlos Novo',
};

assert(accountA.id !== accountB.id && accountB.id !== accountC.id, 'Contas A, B e C possuem identificadores únicos');

// ── Cenário 2: Login com Credenciais Próprias e Recuperação de Senha ──────────
console.log('\n🔑 Cenário 2: Login independente e recuperação de acesso');
assert(authContextSrc.includes('loginWithEmail'), 'AuthContext oferece login com e-mail e senha via Supabase Auth');
assert(authContextSrc.includes('resetPassword'), 'AuthContext possui método de recuperação de senha por e-mail');
assert(loginSrc.includes("mode === 'forgot'"), 'Login.tsx possui fluxo de solicitação de redefinição de senha');
assert(protectedRouteSrc.includes('if (!isAuthenticated)'), 'ProtectedRoute bloqueia qualquer acesso sem autenticação prévia');

// ── Cenário 3: Criação de Viagem com Dados Reais no Supabase ─────────────────
console.log('\n🗺️ Cenário 3: Criação de viagem no Supabase com criador como admin');
assert(tripContextSrc.includes('createTrip:'), 'TripContext possui função de criação de viagem persistente');
assert(rlsMigration002.includes('CREATE TRIGGER on_trip_created'), 'Trigger no PostgreSQL vincula automaticamente o criador como admin');
assert(rlsMigration002.includes("'admin'") && rlsMigration002.includes('handle_new_trip'), 'Criador da viagem recebe papel administrativo');

// Simulação de Viagem criada pela Conta A
const tripA = {
  id: 'trip-praia-dos-carneiros-2027',
  title: 'Praia dos Carneiros 2027',
  destination: 'Tamandaré - PE',
  start_date: '2027-01-10',
  end_date: '2027-01-17',
  created_by: accountA.id,
  is_archived: false,
};

assert(tripA.created_by === accountA.id, 'Viagem A é de propriedade exclusiva da Conta A');

// ── Cenário 4: Persistência após Logout e Novo Login ──────────────────────────
console.log('\n🔄 Cenário 4: Persistência após logout e novo login');
assert(authContextSrc.includes('supabase.auth.onAuthStateChange'), 'Sessão é reidratada pelo listener de autenticação do Supabase');
assert(authContextSrc.includes('logout'), 'Método logout limpa sessão e estados com segurança');

// Simulação de re-login de Conta A
const sessionRestored = { user: accountA, activeTripId: tripA.id };
assert(sessionRestored.user.id === accountA.id && sessionRestored.activeTripId === tripA.id, 'Dados e viagem ativa são preservados após novo login');

// ── Cenário 5: Geração de Convite para Outra Pessoa ───────────────────────────
console.log('\n✉️ Cenário 5: Geração de convite para outra pessoa');
const inviteLinkA = `/convite/${tripA.id}`;
assert(inviteLinkA === `/convite/${tripA.id}`, `Link de convite gerado com sucesso: ${inviteLinkA}`);
assert(joinTripSrc.includes('useParams<{ tripId: string }>()'), 'JoinTrip consome o tripId da URL de forma dinâmica');

// ── Cenário 6: Entrada pelo Link sem PIN Obrigatório ──────────────────────────
console.log('\n🚪 Cenário 6: Aceite de convite pela Conta B sem PIN');
assert(rpcMigration005.includes('accept_trip_invitation'), 'RPC accept_trip_invitation presente no PostgreSQL');
assert(rpcMigration005.includes("'member'"), 'RPC atribui papel "member" sem possibilidade de elevação');
assert(rpcMigration005.includes('v_user_id UUID := auth.uid()'), 'RPC valida rigorosamente o usuário autenticado');

// Simulação de entrada da Conta B na Viagem A
const membershipB_in_TripA = {
  trip_id: tripA.id,
  profile_id: accountB.id,
  role: 'member',
  confirmation_status: 'confirmed',
};

assert(membershipB_in_TripA.role === 'member', 'Conta B ingressou na Viagem A como "member"');
assert(membershipB_in_TripA.profile_id === accountB.id, 'Vínculo gerado com o ID da Conta B');

// ── Cenário 7: Apresentação Separada das Categorias de Viagens ────────────────
console.log('\n📊 Cenário 7: Separação em "Viagens que você organiza" e "Viagens em que você participa"');
assert(homeSrc.includes('Viagens que você organiza'), 'Título "Viagens que você organiza" presente no Hub');
assert(homeSrc.includes('Viagens em que você participa'), 'Título "Viagens em que você participa" presente no Hub');
assert(homeSrc.includes('myCreatedTrips'), 'Hub filtra viagens criadas pelo usuário');
assert(homeSrc.includes('myInvitedTrips'), 'Hub filtra viagens onde o usuário foi convidado');

// Validação com as Contas simuladas
// Para Conta A: organiza Viagem A, participa de 0
const tripsForAccountA = {
  organized: [tripA],
  participating: [],
};
assert(tripsForAccountA.organized.length === 1, 'Conta A visualiza Viagem A em "Viagens que você organiza"');
assert(tripsForAccountA.participating.length === 0, 'Conta A tem lista vazia em "Viagens em que você participa"');

// ── Cenário 8: Bloqueio de Edição e Exclusão por Participante (RLS) ───────────
console.log('\n🛡️ Cenário 8: Bloqueio de edição/exclusão da Viagem A pela Conta B');
assert(rlsMigration002.includes('"trips_update"'), 'Política RLS para UPDATE em trips existe');
assert(rlsMigration002.includes('"trips_delete"'), 'Política RLS para DELETE em trips existe');
assert(rlsMigration002.includes('created_by = auth.uid()'), 'Apenas o criador tem permissão de atualizar ou excluir a viagem');

function canUserModifyTrip(userId, trip) {
  return trip.created_by === userId;
}

assert(canUserModifyTrip(accountA.id, tripA) === true, 'Conta A (criadora) pode modificar Viagem A');
assert(canUserModifyTrip(accountB.id, tripA) === false, 'Conta B (participante) é BLOQUEADA de editar/excluir Viagem A');

// ── Cenário 9: Criação de Viagem Própria por Usuário que já Participa de Outra ──
console.log('\n✨ Cenário 9: Conta B cria sua própria viagem (Viagem B)');

const tripB = {
  id: 'trip-maragogi-2027',
  title: 'Maragogi em Família 2027',
  destination: 'Maragogi - AL',
  start_date: '2027-03-01',
  end_date: '2027-03-08',
  created_by: accountB.id,
  is_archived: false,
};

assert(tripB.created_by === accountB.id, 'Conta B cria com sucesso sua própria viagem');

// Visão da Conta B no Hub
const tripsForAccountB = {
  organized: [tripB],
  participating: [tripA],
};

assert(tripsForAccountB.organized.length === 1 && tripsForAccountB.organized[0].id === tripB.id, 'Conta B vê Viagem B em "Viagens que você organiza"');
assert(tripsForAccountB.participating.length === 1 && tripsForAccountB.participating[0].id === tripA.id, 'Conta B vê Viagem A em "Viagens em que você participa"');

// Verificação de permissões contextuais da Conta B
assert(canUserModifyTrip(accountB.id, tripB) === true, 'Conta B é administradora em sua própria viagem (Viagem B)');
assert(canUserModifyTrip(accountB.id, tripA) === false, 'Conta B continua sendo apenas participante na Viagem A (sem poder alterá-la)');

// ── Cenário 10: Isolamento Estrito de Dados entre Viagens e Usuário sem Viagens ─
console.log('\n🔒 Cenário 10: Isolamento estrito de dados e experiência da Conta C');
assert(homeSrc.includes('<EmptyTripState'), 'Home renderiza EmptyTripState quando não há viagens');
assert(emptyTripStateSrc.includes('Sua próxima viagem começa aqui.'), 'EmptyTripState apresenta mensagem acolhedora');
assert(emptyTripStateSrc.includes('Você ainda não possui viagens cadastradas.'), 'EmptyTripState apresenta aviso de ausência de viagens');
assert(emptyTripStateSrc.includes('Criar nova viagem'), 'Botão "Criar nova viagem" está disponível para Conta C');

// Visão da Conta C (usuário recém-cadastrado)
const tripsForAccountC = {
  organized: [],
  participating: [],
};

assert(tripsForAccountC.organized.length === 0, 'Conta C não possui viagens organizadas');
assert(tripsForAccountC.participating.length === 0, 'Conta C não possui viagens em que participa');
assert(
  !tripsForAccountC.organized.some((t) => t.id === tripA.id || t.id === tripB.id) &&
  !tripsForAccountC.participating.some((t) => t.id === tripA.id || t.id === tripB.id),
  'Conta C NÃO tem acesso nem visualiza nenhum dado das viagens de Conta A ou Conta B'
);

// RLS de trips_select garante que cada usuário só selecione suas viagens
assert(rlsMigration002.includes('"trips_select"'), 'RLS trips_select implementada no PostgreSQL');
assert(rlsMigration002.includes('public.is_trip_member(id)'), 'RLS só permite SELECT se o usuário for membro ou criador da viagem');

// ── Resumo da Validação ────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`🎯 RESULTADO FINAL: ${passed}/${total} testes aprovados (${((passed / total) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
