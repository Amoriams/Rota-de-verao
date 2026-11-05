import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Plane,
  Building2,
  Car,
  Star,
  ChevronRight,
  TrendingUp,
  Shield,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { MOCK_TRIP, MOCK_PARTICIPANTS, MOCK_FLIGHTS, MOCK_ACCOMMODATIONS, MOCK_VEHICLES, MOCK_POLLS } from '../data/mockData';

export const Home: React.FC = () => {
  const confirmedCount = MOCK_PARTICIPANTS.filter(p => p.status === 'confirmed').length;
  const totalCount = MOCK_PARTICIPANTS.length;
  const confirmationPct = Math.round((confirmedCount / totalCount) * 100);

  // Voo mais barato de ida
  const cheapestFlight = MOCK_FLIGHTS
    .filter(f => f.type === 'ida')
    .reduce((min, f) => f.price < min.price ? f : min);

  // Acomodação com menor preço por pessoa
  const cheapestAccommodation = MOCK_ACCOMMODATIONS
    .reduce((min, a) => a.pricePerPersonEstimated < min.pricePerPersonEstimated ? a : min);

  // Veículo mais barato por dia
  const cheapestVehicle = MOCK_VEHICLES
    .reduce((min, v) => v.dailyRate < min.dailyRate ? v : min);

  // Primeira enquete aberta
  const openPoll = MOCK_POLLS.find(p => !p.isClosed);

  // Avatares para "Nossa Turma" (apenas confirmados)
  const confirmedParticipants = MOCK_PARTICIPANTS.filter(p => p.status === 'confirmed');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* ── BLOCO A — Hero com foto de praia ───────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '300px' }}>
        {/* Imagem panorâmica de praia */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
          alt="Praia paradisíaca"
          className="w-full object-cover object-center"
          style={{ height: '340px' }}
        />

        {/* Overlay gradiente para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

        {/* Avatar do usuário — canto superior direito */}
        <div className="absolute top-4 right-5 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80"
            alt="Julia"
            className="w-7 h-7 rounded-full object-cover border-2 border-white"
          />
          <span className="text-white text-sm font-medium">Olá, Julia!</span>
          <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Título e pills de informação */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pb-6">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white drop-shadow-lg tracking-tight mb-1">
            Rota de Verão
          </h1>
          <p className="text-white/90 text-base md:text-lg mb-6 drop-shadow">
            Planejando juntos uma viagem inesquecível! 🌊
          </p>

          {/* Pills de informação */}
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 text-white text-sm font-medium">
              <MapPin className="w-4 h-4 text-cyan-300 shrink-0" />
              {MOCK_TRIP.destination} — {MOCK_TRIP.state}
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 text-white text-sm font-medium">
              <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
              {MOCK_TRIP.startDate} a {MOCK_TRIP.endDate}
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 text-white text-sm font-medium">
              <Users className="w-4 h-4 text-cyan-300 shrink-0" />
              {totalCount} pessoas no grupo
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOCO B — Cards de serviço (Passagens, Hospedagem, Carros) ──────── */}
      <section className="px-4 md:px-6 lg:px-8 -mt-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Card Passagens */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="relative h-32 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80"
                alt="Avião"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Plane className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Passagens Aéreas</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-0.5">Acompanhe os melhores preços</p>
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-2xl font-bold font-display text-slate-800">
                  R$ {cheapestFlight.price.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">a partir de</span>
              </div>
              <Link
                to="/passagens"
                className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors"
              >
                Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Hospedagem */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="relative h-32 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
                alt="Casa de praia"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Hospedagem</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-0.5">Conforto para nosso grupo</p>
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-2xl font-bold font-display text-slate-800">
                  R$ {cheapestAccommodation.pricePerPersonEstimated.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-slate-600 font-medium">4.8 · por pessoa</span>
              </div>
              <Link
                to="/hospedagem"
                className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors"
              >
                Ver opções <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Carros */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="relative h-32 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80"
                alt="SUV"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Car className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Carros para Alugar</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-0.5">Liberdade para explorar</p>
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-2xl font-bold font-display text-slate-800">
                  R$ {cheapestVehicle.dailyRate.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-slate-600 font-medium">4.7 · por dia</span>
              </div>
              <Link
                to="/veiculos"
                className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors"
              >
                Ver opções <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOCOS C + D + E ─────────────────────────────────────────────────── */}
      <section className="px-4 md:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Coluna esquerda: Nossa Turma (C) + Votações (D) */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── Bloco C — Nossa Turma ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  <h2 className="font-display font-bold text-base text-slate-800">Nossa Turma</h2>
                </div>
                <Link
                  to="/participantes"
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-0.5"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Contador */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold font-display text-slate-800">{confirmedCount}</span>
                <span className="text-slate-500 text-sm">de {totalCount} pessoas confirmaram presença</span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${confirmationPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mb-4">{confirmationPct}%</p>

              {/* Avatares */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {confirmedParticipants.slice(0, 5).map(p => (
                    <img
                      key={p.id}
                      src={p.avatarUrl}
                      alt={p.nickname}
                      title={p.name}
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  {confirmedParticipants.length > 5 && (
                    <div className="w-9 h-9 rounded-full border-2 border-white bg-cyan-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-cyan-700">
                        +{confirmedParticipants.length - 5}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {MOCK_PARTICIPANTS.filter(p => p.status === 'pending').length} aguardando confirmação
                </div>
              </div>

              {/* Botão confirmar presença */}
              <Link
                to="/participantes"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar minha presença
              </Link>
            </div>

            {/* ── Bloco D — Votações em Aberto ──────────────────────────────── */}
            {openPoll && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Ícone de barras de votação */}
                    <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="font-display font-bold text-base text-slate-800">Votações em Aberto</h2>
                  </div>
                  <Link
                    to="/enquetes"
                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-0.5"
                  >
                    Ver todas <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <p className="text-sm font-semibold text-slate-700 mb-1">{openPoll.title}</p>
                <p className="text-xs text-slate-500 mb-4">Vote na sua opção:</p>

                {/* Opções com barra de progresso */}
                <div className="space-y-3 mb-4">
                  {openPoll.options.slice(0, 3).map(opt => (
                    <div key={opt.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[75%]">
                          {opt.title}
                        </span>
                        <span className="text-xs font-bold text-slate-600">{opt.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/enquetes"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors"
                >
                  Votar agora
                </Link>
              </div>
            )}
          </div>

          {/* ── Bloco E — Nossa Viagem ───────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
              {/* Foto do destino */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={MOCK_TRIP.coverImageUrl}
                  alt={MOCK_TRIP.destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    <CheckCircle2 className="w-3 h-3" /> Tudo certo!
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-3 text-white">
                  <p className="text-xs font-semibold drop-shadow">Nossa Viagem</p>
                </div>
              </div>

              {/* Informações */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-display font-bold text-sm text-slate-800 mb-3">
                  {MOCK_TRIP.destination} — {MOCK_TRIP.state}
                </h3>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>{MOCK_TRIP.startDate} a {MOCK_TRIP.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Fortaleza, CE</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>{totalCount} participantes · {confirmedCount} confirmados</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sua presença está registrada.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BLOCO F — Rodapé informativo ─────────────────────────────────────── */}
      <footer className="mx-4 md:mx-6 lg:mx-8 mb-6 mt-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* 3 diferenciais */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Divisão de Custos</p>
                  <p className="text-[10px] text-slate-500">Transparente e justa</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Viagem Privada</p>
                  <p className="text-[10px] text-slate-500">Apenas convidados</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Notificações</p>
                  <p className="text-[10px] text-slate-500">Fique por dentro de tudo</p>
                </div>
              </div>
            </div>

            {/* Frase de encerramento */}
            <p className="font-display italic text-sm text-cyan-500 font-semibold whitespace-nowrap">
              Vamos viver esse verão juntos! 🌊
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
