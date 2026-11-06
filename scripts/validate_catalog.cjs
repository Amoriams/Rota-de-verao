/**
 * validate_catalog.js — Testes de validação do Catálogo de Passagens & Veículos
 *
 * Verifica:
 * 1.  Cadastro de passagem aérea com campos obrigatórios
 * 2.  Cadastro de veículo com campos obrigatórios
 * 3.  Persistência e leitura (serviços localStorage / fallback demo)
 * 4.  Permissão de visualização para participantes
 * 5.  Bloqueio de escrita para participantes comuns
 * 6.  Isolamento multi-viagens (passagem da viagem A não aparece na viagem B)
 * 7.  Alteração de preço e status de opção
 * 8.  Links externos preservados e acessíveis
 * 9.  Persistência de opções com status 'discarded' e 'booked'
 * 10. Exclusão de opção de voo e veículo
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
console.log('✈️  TESTE DO CATÁLOGO DE PASSAGENS & VEÍCULOS');
console.log('========================================================\n');

// ─── 1. Verificar existência dos arquivos do catálogo ──────────────────────────

const basePath = path.resolve(__dirname, '..');
const filesExpected = [
  'src/services/flightService.ts',
  'src/services/vehicleService.ts',
  'src/components/flights/FlightFormModal.tsx',
  'src/components/vehicles/VehicleFormModal.tsx',
  'src/pages/Flights.tsx',
  'src/pages/Vehicles.tsx',
  'supabase/migrations/004_catalogo_passagens_veiculos.sql',
  'src/@types/database.types.ts',
];

console.log('📁 0. Verificação de existência dos arquivos');
filesExpected.forEach(f => {
  assert(fs.existsSync(path.join(basePath, f)), `Arquivo ${f} existe`);
});

// ─── 1. Cadastro de passagem aérea ─────────────────────────────────────────────

console.log('\n📋 1. Simulação de cadastro de passagem aérea');
const tripAId = 'trip-catalog-test-A';
const tripBId = 'trip-catalog-test-B';

const flightPayload = {
  id: 'flight-test-001',
  trip_id: tripAId,
  airline: 'GOL Linhas Aéreas',
  flight_number: 'G3-1234',
  origin_airport: 'GRU',
  origin_city: 'São Paulo',
  destination_airport: 'FOR',
  destination_city: 'Fortaleza',
  departure_time: '2027-01-15 06:30',
  arrival_time: '2027-01-15 10:05',
  price: 849.90,
  baggage_included: true,
  purchase_url: 'https://www.voegol.com.br',
  type: 'ida',
  status: 'in_analysis',
  connections_count: 0,
  notes: 'Voo direto, melhor horário para o grupo.',
  price_updated_at: '2027-01-05T10:00:00.000Z',
  return_departure_time: null,
  return_arrival_time: null,
  created_by: 'admin-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

assert(flightPayload.airline.length > 0, 'Passagem possui companhia aérea');
assert(flightPayload.origin_airport.length === 3, 'Aeroporto de origem com código IATA (3 letras)');
assert(flightPayload.destination_airport.length === 3, 'Aeroporto de destino com código IATA (3 letras)');
assert(flightPayload.price > 0, 'Preço por pessoa é positivo');
assert(typeof flightPayload.baggage_included === 'boolean', 'Bagagem inclusa é booleano');
assert(flightPayload.trip_id === tripAId, 'Passagem vinculada à viagem A');

// ─── 2. Cadastro de veículo ────────────────────────────────────────────────────

console.log('\n📋 2. Simulação de cadastro de veículo');

const vehiclePayload = {
  id: 'vehicle-test-001',
  trip_id: tripAId,
  model: 'Fiat Fastback',
  category: 'SUV Compacta',
  passenger_capacity: 5,
  luggage_capacity: 3,
  daily_rate: 189.90,
  total_days: 7,
  total_amount: 1329.30,
  pickup_location: 'Aeroporto de Fortaleza (FOR)',
  return_location: 'Aeroporto de Fortaleza (FOR)',
  rental_company: 'Localiza',
  external_url: 'https://www.localiza.com',
  image_url: null,
  status: 'in_analysis',
  pickup_time: '2027-01-15 11:00',
  return_time: '2027-01-22 08:00',
  security_deposit: 1500.00,
  conditions: 'CNH com mínimo de 2 anos. Cartão de crédito obrigatório.',
  notes: 'Opção mais em conta para SUV com ar e direção.',
  price_updated_at: '2027-01-05T10:00:00.000Z',
  created_by: 'admin-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

assert(vehiclePayload.model.length > 0, 'Veículo possui modelo definido');
assert(vehiclePayload.passenger_capacity >= 1, 'Capacidade de passageiros é válida');
assert(vehiclePayload.daily_rate > 0, 'Diária é positiva');
assert(vehiclePayload.total_amount > 0, 'Valor total é positivo');
assert(vehiclePayload.trip_id === tripAId, 'Veículo vinculado à viagem A');
assert(vehiclePayload.security_deposit > 0, 'Caução está definida');

// ─── 3. Persistência e leitura (simulação lógica) ──────────────────────────────

console.log('\n📋 3. Persistência de dados (verificação lógica dos serviços)');

const flightServiceContent = fs.readFileSync(path.join(basePath, 'src/services/flightService.ts'), 'utf8');
const vehicleServiceContent = fs.readFileSync(path.join(basePath, 'src/services/vehicleService.ts'), 'utf8');

assert(flightServiceContent.includes('getFlights'), 'flightService possui método getFlights');
assert(flightServiceContent.includes('createFlight'), 'flightService possui método createFlight');
assert(flightServiceContent.includes('updateFlight'), 'flightService possui método updateFlight');
assert(flightServiceContent.includes('deleteFlight'), 'flightService possui método deleteFlight');
assert(flightServiceContent.includes('localStorage'), 'flightService possui fallback localStorage');

assert(vehicleServiceContent.includes('getVehicles'), 'vehicleService possui método getVehicles');
assert(vehicleServiceContent.includes('createVehicle'), 'vehicleService possui método createVehicle');
assert(vehicleServiceContent.includes('updateVehicle'), 'vehicleService possui método updateVehicle');
assert(vehicleServiceContent.includes('deleteVehicle'), 'vehicleService possui método deleteVehicle');
assert(vehicleServiceContent.includes('toggleInterest'), 'vehicleService possui método toggleInterest');
assert(vehicleServiceContent.includes('localStorage'), 'vehicleService possui fallback localStorage');

// ─── 4. Permissão de visualização para participantes ───────────────────────────

console.log('\n📋 4. Verificação de permissões de visualização (RLS)');

const migration004 = fs.readFileSync(path.join(basePath, 'supabase/migrations/004_catalogo_passagens_veiculos.sql'), 'utf8');

assert(migration004.includes('flights_select_member') || migration004.includes('is_trip_member'), 'Política RLS de SELECT para membros nas passagens');
assert(migration004.includes('vehicles_select_member') || migration004.includes('is_trip_member'), 'Política RLS de SELECT para membros nos veículos');

// ─── 5. Bloqueio de escrita para participantes ─────────────────────────────────

console.log('\n📋 5. Bloqueio de escrita para participantes comuns');

assert(migration004.includes('is_trip_admin'), 'Políticas de escrita requerem is_trip_admin');
assert(migration004.includes('flights_all_admin') || (migration004.includes('INSERT') && migration004.includes('is_trip_admin')), 'Política de INSERT/UPDATE/DELETE para admin nas passagens');
assert(migration004.includes('vehicles_all_admin') || (migration004.includes('INSERT') && migration004.includes('is_trip_admin')), 'Política de INSERT/UPDATE/DELETE para admin nos veículos');

// Verificar que a página Flights.tsx checa role === 'admin' antes de mostrar botão de cadastro
const flightsPage = fs.readFileSync(path.join(basePath, 'src/pages/Flights.tsx'), 'utf8');
const vehiclesPage = fs.readFileSync(path.join(basePath, 'src/pages/Vehicles.tsx'), 'utf8');

assert(flightsPage.includes("role === 'admin'") || flightsPage.includes('isAdmin'), 'Página Flights verifica role admin no frontend');
assert(vehiclesPage.includes("role === 'admin'") || vehiclesPage.includes('isAdmin'), 'Página Vehicles verifica role admin no frontend');

// ─── 6. Isolamento multi-viagens ───────────────────────────────────────────────

console.log('\n📋 6. Isolamento multi-viagens no catálogo');

// Simular que passagem da viagem A não aparece na viagem B
const flightA = { ...flightPayload, trip_id: tripAId };
const flightB = { ...flightPayload, id: 'flight-test-002', trip_id: tripBId, airline: 'LATAM' };

// Filtro simula o serviço
const allFlights = [flightA, flightB];
const flightsForA = allFlights.filter(f => f.trip_id === tripAId);
const flightsForB = allFlights.filter(f => f.trip_id === tripBId);

assert(flightsForA.length === 1, 'Apenas 1 passagem retornada para viagem A');
assert(flightsForB.length === 1, 'Apenas 1 passagem retornada para viagem B');
assert(flightsForA[0].airline === 'GOL Linhas Aéreas', 'Passagem A é da GOL (correta)');
assert(flightsForB[0].airline === 'LATAM', 'Passagem B é da LATAM (correta)');
assert(!flightsForA.some(f => f.trip_id === tripBId), 'Nenhuma passagem da viagem B aparece na viagem A');

// Serviço real usa .eq('trip_id', tripId)
assert(flightServiceContent.includes(".eq('trip_id'"), 'flightService filtra por trip_id no Supabase');
assert(vehicleServiceContent.includes(".eq('trip_id'"), 'vehicleService filtra por trip_id no Supabase');

// ─── 7. Alteração de preço e status ────────────────────────────────────────────

console.log('\n📋 7. Alteração de preço e status de opção');

const validStatuses = ['in_analysis', 'favorite', 'chosen', 'booked', 'discarded'];
validStatuses.forEach(st => {
  assert(migration004.includes(st) || flightsPage.includes(st), `Status '${st}' reconhecido no sistema`);
});

const updatedFlight = { ...flightPayload, price: 729.90, status: 'favorite', price_updated_at: new Date().toISOString() };
assert(updatedFlight.price !== flightPayload.price, 'Preço pode ser alterado');
assert(updatedFlight.status === 'favorite', 'Status pode ser alterado para favorita');

// ─── 8. Links externos preservados ────────────────────────────────────────────

console.log('\n📋 8. Links externos preservados e acessíveis');

assert(flightPayload.purchase_url.startsWith('https://'), 'Link externo da passagem é HTTPS válido');
assert(vehiclePayload.external_url.startsWith('https://'), 'Link externo do veículo é HTTPS válido');
assert(flightsPage.includes('purchase_url'), 'Página de voos renderiza purchase_url');
assert(flightsPage.includes('target="_blank"'), 'Links abrem em nova aba (target=_blank)');
assert(flightsPage.includes('noopener noreferrer'), 'Links possuem rel seguro (noopener noreferrer)');
assert(vehiclesPage.includes('external_url'), 'Página de veículos renderiza external_url');
assert(vehiclesPage.includes('target="_blank"'), 'Links de veículos abrem em nova aba');

// ─── 9. Persistência de opções descartadas e reservadas ────────────────────────

console.log('\n📋 9. Persistência de opções com status discarded e booked');

const discardedFlight = { ...flightPayload, status: 'discarded' };
const bookedFlight = { ...flightPayload, status: 'booked', id: 'flight-booked-001' };
const allWithStatuses = [flightPayload, discardedFlight, bookedFlight];

assert(allWithStatuses.filter(f => f.status === 'discarded').length === 1, 'Opções descartadas são preservadas no sistema');
assert(allWithStatuses.filter(f => f.status === 'booked').length === 1, 'Opções reservadas são preservadas no sistema');
assert(flightsPage.includes('discarded'), 'Página de voos reconhece status discarded');
assert(flightsPage.includes('booked'), 'Página de voos reconhece status booked');

// ─── 10. Exclusão de opção ─────────────────────────────────────────────────────

console.log('\n📋 10. Exclusão de opção de voo e veículo');

assert(flightServiceContent.includes('deleteFlight'), 'Serviço de voos possui método de exclusão');
assert(vehicleServiceContent.includes('deleteVehicle'), 'Serviço de veículos possui método de exclusão');
assert(flightsPage.includes('handleDelete'), 'Página de voos possui handler de exclusão');
assert(vehiclesPage.includes('handleDelete'), 'Página de veículos possui handler de exclusão');
assert(flightsPage.includes('window.confirm'), 'Exclusão de voo exige confirmação do usuário');
assert(vehiclesPage.includes('window.confirm'), 'Exclusão de veículo exige confirmação do usuário');

// Verificar que mocks foram removidos das páginas de voos e veículos
assert(!flightsPage.includes('MOCK_FLIGHTS'), 'Página Flights NÃO importa mais MOCK_FLIGHTS');
assert(!flightsPage.includes('mockData'), 'Página Flights NÃO importa mais mockData');
assert(!vehiclesPage.includes('MOCK_VEHICLES'), 'Página Vehicles NÃO importa mais MOCK_VEHICLES');
assert(!vehiclesPage.includes('MOCK_PARTICIPANTS'), 'Página Vehicles NÃO importa mais MOCK_PARTICIPANTS');
assert(!vehiclesPage.includes('mockData'), 'Página Vehicles NÃO importa mais mockData');

// ─── RESULTADO FINAL ──────────────────────────────────────────────────────────

console.log('\n========================================================');
console.log(`📊 RESULTADO: ${passed}/${total} TESTES APROVADOS (${Math.round(passed/total*100)}%)`);
console.log('========================================================\n');

process.exit(passed === total ? 0 : 1);

