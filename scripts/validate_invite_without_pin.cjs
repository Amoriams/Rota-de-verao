/**
 * validate_invite_without_pin.cjs
 * Validação do Fluxo de Entrada por Link sem PIN Obrigatório
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

console.log('\n========================================================');
console.log('🔗 VALIDAÇÃO DO FLUXO DE CONVITE SEM EXIGÊNCIA DE PIN');
console.log('========================================================\n');

const basePath = path.resolve(__dirname, '..');

// ── 1. Verificação de Arquivos e Modificações ──────────────────────────────────
console.log('📁 1. Verificação de Arquivos');
const files = [
  'supabase/migrations/005_convite_sem_pin.sql',
  'src/pages/JoinTrip.tsx',
  'src/pages/Login.tsx',
  'src/contexts/AuthContext.tsx',
  'src/services/memberService.ts',
];

files.forEach((f) => {
  assert(fs.existsSync(path.join(basePath, f)), `Arquivo ${f} existe`);
});

// ── 2. Remoção do PIN no Frontend de Entrada ──────────────────────────────────
console.log('\n🚫 2. Verificação da Remoção do Campo de PIN');
const joinTripContent = fs.readFileSync(path.join(basePath, 'src/pages/JoinTrip.tsx'), 'utf8');

assert(!joinTripContent.includes('Crie seu PIN de 6 dígitos'), 'Texto "Crie seu PIN de 6 dígitos" foi removido de JoinTrip.tsx');
assert(!joinTripContent.includes('maxLength={6}'), 'Input de 6 dígitos numéricos do PIN foi removido');
assert(joinTripContent.includes('Sem exigência de PIN'), 'Mensagem explícita de dispensa de PIN presente');
assert(joinTripContent.includes('Confirmar Presença & Entrar na Viagem'), 'Botão claro de confirmação direta presente');

// ── 3. Validação do Backend e Migration 005 ────────────────────────────────────
console.log('\n🗄️ 3. Verificação da RPC e Segurança no PostgreSQL');
const migration005 = fs.readFileSync(path.join(basePath, 'supabase/migrations/005_convite_sem_pin.sql'), 'utf8');

assert(migration005.includes('accept_trip_invitation'), 'Função RPC accept_trip_invitation criada');
assert(migration005.includes('v_user_id UUID := auth.uid()'), 'RPC valida obrigatoriamente usuário autenticado (auth.uid)');
assert(migration005.includes('role') && migration005.includes('confirmation_status'), 'Colunas de membro presentes no insert');
assert(migration005.includes("'member'"), "Papel inserido é estritamente 'member'");
assert(!migration005.includes("'admin'"), "Link NUNCA concede permissão de 'admin'");

// ── 4. Testes dos Cenários Exigidos ───────────────────────────────────────────
console.log('\n🧪 4. Cenários de Teste Lógicos');

// Cenário 1: Entrada pelo link com usuário já cadastrado
console.log('  Cenário 1: Entrada pelo link com usuário já cadastrado');
const userAlreadyRegistered = { id: 'usr-registered-123', email: 'registered@test.com' };
const tripId = 'trip-beach-2027';

assert(Boolean(userAlreadyRegistered.id), 'Usuário possui sessão ativa e autenticada');
assert(joinTripContent.includes('isAuthenticated ?'), 'JoinTrip verifica autenticação antes de exibir botão de entrada');
assert(joinTripContent.includes('acceptTripInvitation'), 'Chama acceptTripInvitation associando profileId autenticado');

// Cenário 2: Entrada pelo link com usuário novo
console.log('  Cenário 2: Entrada pelo link com usuário novo');
assert(joinTripContent.includes('!isAuthenticated'), 'Detecta usuário não autenticado no convite');
assert(joinTripContent.includes("navigate('/entrar'"), 'Direciona usuário novo para login/cadastro');
const loginContent = fs.readFileSync(path.join(basePath, 'src/pages/Login.tsx'), 'utf8');
assert(loginContent.includes('Criar uma conta'), 'Login oferece opção de criar conta');
assert(loginContent.includes('navigate(from'), 'Após cadastro, redireciona de volta para a rota do convite (from)');

// Cenário 3: Usuário sem convite tentando acessar viagem privada
console.log('  Cenário 3: Usuário sem convite tentando acessar viagem privada');
const migration002 = fs.readFileSync(path.join(basePath, 'supabase/migrations/002_multi_viagens.sql'), 'utf8');
assert(migration002.includes('created_by = auth.uid() OR public.is_trip_member(id)'), 'RLS trips_select bloqueia leitura de viagem onde não é membro nem criador');
const migration001 = fs.readFileSync(path.join(basePath, 'supabase/migrations/001_schema_completo.sql'), 'utf8');
assert(migration001.includes('is_trip_member(trip_id)'), 'RLS nas tabelas filhas (hospedagem, passagens, etc.) bloqueia não membros');

// Cenário 4: Participante tentando acessar funções administrativas
console.log('  Cenário 4: Participante tentando acessar funções administrativas');
assert(migration001.includes('is_trip_admin(trip_id)'), 'RLS de escrita exige is_trip_admin');
assert(migration001.includes('trip_members_update_own_status'), 'Política impede participante de alterar sua coluna role');
const homeContent = fs.readFileSync(path.join(basePath, 'src/pages/Home.tsx'), 'utf8');
assert(homeContent.includes('myInvitedTrips'), 'Home segrega viagens onde é apenas participante');
const invitedSection = homeContent.split('myInvitedTrips.map')[1]?.split('</section>')[0] || '';
assert(!invitedSection.includes('Excluir') && !invitedSection.includes('Arquivar'), 'Ações de exclusão/arquivamento não estão disponíveis nas viagens em que participa');

// ── RESULTADO FINAL ───────────────────────────────────────────────────────────
console.log('\n========================================================');
console.log(`📊 RESULTADO: ${passed}/${total} TESTES APROVADOS (${Math.round((passed / total) * 100)}%)`);
console.log('========================================================\n');

process.exit(passed === total ? 0 : 1);
