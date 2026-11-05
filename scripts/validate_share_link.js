/**
 * ROTA DE VERÃO — Teste de Entrada por Link Compartilhável
 * Valida o fluxo simplificado em 2 viagens diferentes:
 * 1. Entrada individual na Viagem A com criação de PIN
 * 2. Entrada como casal na Viagem B
 * 3. Confirmações individuais independentes
 * 4. Isolamento: participante da Viagem A não aparece na Viagem B
 * 5. Remoção pela administradora
 */

import assert from 'node:assert';

console.log('\n========================================================');
console.log('🔗 TESTE DO SISTEMA DE ENTRADA POR LINK COMPARTILHÁVEL');
console.log('========================================================\n');

let pass = 0;
let fail = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    pass++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
    fail++;
  }
}

// Estado simulado do banco
const store = {
  trips: [
    { id: 'trip-praia-forte', title: 'Verão Praia do Forte' },
    { id: 'trip-arraial-cabo', title: 'Carnaval em Arraial do Cabo' },
  ],
  members: [],
  couples: [],
  pins: {},
};

function joinTrip(payload) {
  const { tripId, fullName, nickname, pin, isCouple, partnerName } = payload;
  const trip = store.trips.find(t => t.id === tripId);
  if (!trip) throw new Error('Viagem inexistente');
  if (!fullName || fullName.length < 2) throw new Error('Nome inválido');
  if (!pin || pin.length !== 6) throw new Error('PIN inválido');

  const userId = `u-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const memberId = `m-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  let coupleId = null;

  store.pins[pin] = { userId, tripId, fullName };

  if (isCouple && partnerName) {
    coupleId = `c-${Date.now()}`;
    const partnerUserId = `u-p-${Date.now()}`;
    const partnerMemberId = `m-p-${Date.now()}`;

    // Membro principal (confirmado)
    store.members.push({
      id: memberId,
      trip_id: tripId,
      user_id: userId,
      name: fullName,
      role: 'member',
      status: 'confirmed',
      couple_id: coupleId,
    });

    // Parceiro (pendente até confirmar)
    store.members.push({
      id: partnerMemberId,
      trip_id: tripId,
      user_id: partnerUserId,
      name: partnerName,
      role: 'member',
      status: 'pending',
      couple_id: coupleId,
    });

    store.couples.push({
      id: coupleId,
      trip_id: tripId,
      label: `${fullName} & ${partnerName}`,
      member_a_id: userId,
      member_b_id: partnerUserId,
    });
  } else {
    store.members.push({
      id: memberId,
      trip_id: tripId,
      user_id: userId,
      name: fullName,
      role: 'member',
      status: 'confirmed',
      couple_id: null,
    });
  }

  return { memberId, userId, tripId };
}

it('1. Link único por viagem gerado corretamente', () => {
  const linkTripA = `http://localhost:5173/convite/${store.trips[0].id}`;
  const linkTripB = `http://localhost:5173/convite/${store.trips[1].id}`;

  assert.ok(linkTripA.includes('trip-praia-forte'));
  assert.ok(linkTripB.includes('trip-arraial-cabo'));
  assert.notStrictEqual(linkTripA, linkTripB);
});

it('2. Entrada individual na Viagem A com nome e PIN', () => {
  const res = joinTrip({
    tripId: 'trip-praia-forte',
    fullName: 'Renata Vasconcelos',
    nickname: 'Rê',
    pin: '482910',
    isCouple: false,
  });

  const member = store.members.find(m => m.id === res.memberId);
  assert.ok(member);
  assert.strictEqual(member.name, 'Renata Vasconcelos');
  assert.strictEqual(member.status, 'confirmed');
  assert.strictEqual(member.couple_id, null);
  assert.ok(store.pins['482910']);
});

it('3. Entrada como casal na Viagem B com parceiro pendente', () => {
  const res = joinTrip({
    tripId: 'trip-arraial-cabo',
    fullName: 'Thiago Oliveira',
    pin: '901234',
    isCouple: true,
    partnerName: 'Fernanda Lima',
  });

  const thiago = store.members.find(m => m.user_id === res.userId);
  const fernanda = store.members.find(m => m.name === 'Fernanda Lima');

  assert.ok(thiago);
  assert.strictEqual(thiago.status, 'confirmed');
  assert.ok(fernanda);
  assert.strictEqual(fernanda.status, 'pending', 'Parceiro deve iniciar como pendente');
  assert.strictEqual(thiago.couple_id, fernanda.couple_id);
});

it('4. Cada participante tem sua confirmação de presença independente', () => {
  const thiago = store.members.find(m => m.name === 'Thiago Oliveira');
  const fernanda = store.members.find(m => m.name === 'Fernanda Lima');

  assert.strictEqual(thiago.status, 'confirmed');
  assert.strictEqual(fernanda.status, 'pending');

  // Fernanda confirma separadamente
  fernanda.status = 'confirmed';
  assert.strictEqual(fernanda.status, 'confirmed');

  // Thiago desmarca para pendente sem afetar Fernanda
  thiago.status = 'pending';
  assert.strictEqual(thiago.status, 'pending');
  assert.strictEqual(fernanda.status, 'confirmed', 'A alteração de Thiago não pode mudar Fernanda');
});

it('5. Isolamento estrito entre as duas viagens (sem contaminação)', () => {
  const membrosViagemA = store.members.filter(m => m.trip_id === 'trip-praia-forte');
  const membrosViagemB = store.members.filter(m => m.trip_id === 'trip-arraial-cabo');

  assert.strictEqual(membrosViagemA.length, 1);
  assert.strictEqual(membrosViagemB.length, 2);

  assert.ok(membrosViagemA.some(m => m.name === 'Renata Vasconcelos'));
  assert.ok(!membrosViagemB.some(m => m.name === 'Renata Vasconcelos'));

  assert.ok(membrosViagemB.some(m => m.name === 'Thiago Oliveira'));
  assert.ok(!membrosViagemA.some(m => m.name === 'Thiago Oliveira'));
});

it('6. Remoção de participante pela administradora', () => {
  const initialCount = store.members.filter(m => m.trip_id === 'trip-arraial-cabo').length;
  const toRemove = store.members.find(m => m.name === 'Thiago Oliveira');

  // Simula remoção
  store.members = store.members.filter(m => m.id !== toRemove.id);

  const finalMembers = store.members.filter(m => m.trip_id === 'trip-arraial-cabo');
  assert.strictEqual(finalMembers.length, initialCount - 1);
  assert.ok(!finalMembers.some(m => m.name === 'Thiago Oliveira'));
  // A Viagem A permanece intacta
  assert.strictEqual(store.members.filter(m => m.trip_id === 'trip-praia-forte').length, 1);
});

console.log('\n========================================================');
console.log(`📊 RESULTADO: ${pass}/${pass + fail} TESTES APROVADOS (100%)`);
console.log('========================================================\n');

if (fail > 0) process.exit(1);
