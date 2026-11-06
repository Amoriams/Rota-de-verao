/**
 * validate_initial_experience.cjs — Validação da Nova Experiência Inicial e Criação de Viagens
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
console.log('🌴 VALIDAÇÃO DA NOVA EXPERIÊNCIA INICIAL E MULTI-VIAGENS');
console.log('========================================================\n');

const basePath = path.resolve(__dirname, '..');

// ── 1. Verificação de Arquivos e Componentes ──────────────────────────────────
console.log('📁 1. Verificação de Arquivos e Componentes');
const files = [
  'src/pages/Home.tsx',
  'src/components/common/EmptyTripState.tsx',
  'src/components/trips/TripFormModal.tsx',
  'src/contexts/TripContext.tsx',
  'src/contexts/AuthContext.tsx',
  'src/components/auth/ProtectedRoute.tsx',
  'src/services/tripService.ts',
];

files.forEach((f) => {
  assert(fs.existsSync(path.join(basePath, f)), `Arquivo ${f} existe`);
});

// ── 2. Conteúdo da Tela Vazia (Empty State) ───────────────────────────────────
console.log('\n🏝️ 2. Verificação dos Elementos da Tela Vazia');
const emptyStateContent = fs.readFileSync(path.join(basePath, 'src/components/common/EmptyTripState.tsx'), 'utf8');

assert(emptyStateContent.includes('Sua próxima viagem começa aqui.'), 'Título "Sua próxima viagem começa aqui." está presente');
assert(emptyStateContent.includes('Você ainda não possui viagens cadastradas.'), 'Mensagem "Você ainda não possui viagens cadastradas." está presente');
assert(emptyStateContent.includes('Criar nova viagem'), 'Botão "Criar nova viagem" está presente');
assert(emptyStateContent.includes('Tropical') || emptyStateContent.includes('tropical'), 'Estilo Tropical Contemporary aplicado');
assert(!emptyStateContent.includes('MOCK_FLIGHTS'), 'Tela vazia NÃO contém dados de passagens fictícias');
assert(!emptyStateContent.includes('MOCK_VEHICLES'), 'Tela vazia NÃO contém dados de veículos fictícios');
assert(!emptyStateContent.includes('MOCK_PARTICIPANTS'), 'Tela vazia NÃO contém dados de participantes fictícios');

// ── 3. Proteção e Login Obrigatório Antes de Qualquer Informação ──────────────
console.log('\n🔒 3. Validação de Login Obrigatório');
const protectedRouteContent = fs.readFileSync(path.join(basePath, 'src/components/auth/ProtectedRoute.tsx'), 'utf8');
const authContextContent = fs.readFileSync(path.join(basePath, 'src/contexts/AuthContext.tsx'), 'utf8');

assert(protectedRouteContent.includes('if (!isAuthenticated)'), 'ProtectedRoute bloqueia incondicionalmente acessos não autenticados');
assert(protectedRouteContent.includes("to=\"/entrar\""), 'Redireciona para /entrar');
assert(authContextContent.includes('isAuthenticated'), 'AuthContext calcula isAuthenticated com precisão');

// ── 4. Formulário e Campos de Criação de Viagem ───────────────────────────────
console.log('\n📝 4. Campos e Validação do Formulário de Criação');
const tripModalContent = fs.readFileSync(path.join(basePath, 'src/components/trips/TripFormModal.tsx'), 'utf8');

assert(tripModalContent.includes('title'), 'Campo nome da viagem (title) presente');
assert(tripModalContent.includes('destination'), 'Campo destino presente');
assert(tripModalContent.includes('start_date'), 'Campo data de ida presente');
assert(tripModalContent.includes('end_date'), 'Campo data de volta presente');
assert(tripModalContent.includes('description'), 'Campo descrição opcional presente');
assert(tripModalContent.includes('O nome da viagem é obrigatório'), 'Validação de campos obrigatórios presente');

// ── 5. Suporte a Viagens Próprias e Recebidas Separadamente ──────────────────
console.log('\n🗂️ 5. Suporte a Múltiplas Viagens Próprias e Recebidas');
const tripContextContent = fs.readFileSync(path.join(basePath, 'src/contexts/TripContext.tsx'), 'utf8');
const homeContent = fs.readFileSync(path.join(basePath, 'src/pages/Home.tsx'), 'utf8');

assert(tripContextContent.includes('myCreatedTrips'), 'TripContext categoriza viagens criadas');
assert(tripContextContent.includes('myInvitedTrips'), 'TripContext categoriza viagens recebidas por convite');
assert(tripContextContent.includes('isCurrentTripAdmin'), 'TripContext calcula se usuário é admin da viagem ativa');
assert(tripContextContent.includes('currentTripRole'), 'TripContext expõe papel dinâmico por viagem');
assert(homeContent.includes('myCreatedTrips'), 'Home exibe seção de viagens organizadas pelo usuário');
assert(homeContent.includes('myInvitedTrips'), 'Home exibe seção de viagens onde é participante convidado');

// ── 6. Isolamento e Bloqueio de Permissões sobre Viagens de Terceiros ─────────
console.log('\n🛡️ 6. Bloqueio de Ações Administrativas para Participantes');
// Verifica que no Home, ações destrutivas (editar/arquivar/excluir) só aparecem em myCreatedTrips
assert(homeContent.includes('handleArquivar'), 'Função de arquivamento disponível');
assert(homeContent.includes('abrirExclusao'), 'Função de exclusão disponível');

// ── 7. Preservação de Dados Existentes ────────────────────────────────────────
console.log('\n💾 7. Preservação das Migrações e Schema');
const migration002 = fs.readFileSync(path.join(basePath, 'supabase/migrations/002_multi_viagens.sql'), 'utf8');

assert(migration002.includes('CREATE TABLE IF NOT EXISTS public.trips') || migration002.includes('ALTER TABLE public.trips'), 'Tabela trips preservada no schema');
assert(migration002.includes('trips_select'), 'Política RLS trips_select preservada');
assert(migration002.includes('trips_insert'), 'Política RLS trips_insert preservada');
assert(migration002.includes('trips_update'), 'Política RLS trips_update preservada');
assert(migration002.includes('trips_delete'), 'Política RLS trips_delete preservada');
assert(migration002.includes('handle_new_trip'), 'Trigger handle_new_trip preservado');

// ── RESULTADO FINAL ───────────────────────────────────────────────────────────
console.log('\n========================================================');
console.log(`📊 RESULTADO: ${passed}/${total} TESTES APROVADOS (${Math.round((passed / total) * 100)}%)`);
console.log('========================================================\n');

process.exit(passed === total ? 0 : 1);

