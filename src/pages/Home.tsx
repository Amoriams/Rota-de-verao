import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Plane,
  Car,
  Star,
  ChevronRight,
  TrendingUp,
  Shield,
  Bell,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Sun,
  Compass,
  Palmtree,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { tripService } from '../services/tripService';
import { memberService } from '../services/memberService';
import { flightService } from '../services/flightService';
import { accommodationService } from '../services/accommodationService';
import { vehicleService } from '../services/vehicleService';
import { pollService } from '../services/pollService';
import { Trip, TripMemberWithProfile, Flight, Accommodation, VehicleWithInterests, PollWithOptions } from '../@types/database.types';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { currentTrip } = useTrip();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMemberWithProfile[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithInterests[]>([]);
  const [polls, setPolls] = useState<PollWithOptions[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      // 1. Usa a viagem ativa selecionada no contexto (ou busca fallback)
      const tripData = currentTrip || await tripService.getTrip();
      setTrip(tripData);

      if (!tripData) {
        // Sem viagem ativa — mantém estado vazio sem erro
        return;
      }

      // 2. Busca membros, voos, acomodações, veículos e enquetes
      const [membersData, flightsData, accsData, vehiclesData, pollsData] = await Promise.all([
        memberService.getMembers(tripData.id),
        flightService.getFlights(tripData.id),
        accommodationService.getAccommodations(tripData.id),
        vehicleService.getVehicles(tripData.id),
        pollService.getPolls(tripData.id),
      ]);

      setMembers(membersData);
      setFlights(flightsData);
      setAccommodations(accsData);
      setVehicles(vehiclesData);
      setPolls(pollsData);
    } catch (err: unknown) {
      console.error('Falha ao carregar dados da página inicial:', err);
      if (isSupabaseConfigured) {
        setIsError(true);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Não foi possível conectar ao banco de dados da viagem. Verifique sua conexão ou tente novamente.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, currentTrip?.id]);

  // Cálculo de contagem regressiva para a viagem
  const daysUntilTrip = useMemo(() => {
    if (!trip?.start_date) return null;
    const target = new Date(trip.start_date).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [trip?.start_date]);

  // Cálculos consolidados
  const confirmedCount = members.filter(p => p.confirmation_status === 'confirmed').length;
  const totalCount = members.length;
  const confirmationPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

  // Voo mais barato
  const cheapestFlight = flights.length > 0
    ? flights.filter(f => f.type === 'ida').reduce((min, f) => (f.price < min.price ? f : min), flights[0])
    : null;

  // Acomodação favorita ou com melhor custo-benefício
  const bestAccommodation = accommodations.length > 0
    ? accommodations.find(a => a.is_favorite) || accommodations[0]
    : null;

  // Veículo mais acessível por dia
  const cheapestVehicle = vehicles.length > 0
    ? vehicles.reduce((min, v) => (v.daily_rate < min.daily_rate ? v : min), vehicles[0])
    : null;

  // Primeira enquete aberta
  const openPoll = polls.find(p => !p.is_closed);

  // Participantes confirmados
  const confirmedParticipants = members.filter(p => p.confirmation_status === 'confirmed');

  // Loading skeleton no padrão Tropical Contemporary
  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-tropical-bg">
        <div className="w-14 h-14 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center animate-pulse mb-4 shadow-tropical-sm">
          <Palmtree className="w-7 h-7 text-tropical-ocean" />
        </div>
        <h3 className="font-display font-bold text-lg text-tropical-text">
          Conectando à Rota de Verão...
        </h3>
        <p className="text-tropical-text-muted text-sm mt-1">
          Preparando as informações da praia e do seu grupo 🌊
        </p>
      </div>
    );
  }

  // Tratamento de erro com Supabase ativo
  if (isError && isSupabaseConfigured) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-tropical-bg">
        <div className="w-16 h-16 rounded-3xl bg-tropical-coral-50 text-tropical-coral flex items-center justify-center mb-4 border border-tropical-coral-200 shadow-tropical-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-tropical-text mb-2">
          Falha na conexão com o banco de dados
        </h2>
        <p className="text-tropical-text-muted text-sm max-w-md mb-6 leading-relaxed">
          {errorMessage}
        </p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 text-white font-semibold text-sm transition-all shadow-tropical cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-tropical-bg pb-12 animate-fade-in">
      
      {/* ── SEÇÃO 1: HERO EDITORIAL COM FOTOGRAFIA DE DESTINO ───────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* Banner com altura equilibrada e perspectiva contemporânea */}
        <div className="relative h-[380px] md:h-[440px] w-full overflow-hidden">
          <img
            src={trip?.cover_image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"}
            alt="Praia e mar paradisíaco no Ceará"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          />
          
          {/* Gradiente sofisticado com tons de areia e oceano */}
          <div className="absolute inset-0 bg-gradient-to-t from-tropical-text via-tropical-text/40 to-black/30" />

          {/* Badge superior com clima tropical & saudação */}
          <div className="absolute top-5 right-5 sm:right-8 flex items-center gap-3 z-10">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/25 shadow-tropical-sm text-white text-xs font-semibold">
              <Sun className="w-4 h-4 text-tropical-sand-300 animate-spin" style={{ animationDuration: '30s' }} />
              <span>31°C &bull; Ensolarado</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-white/30 text-white text-xs font-medium">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                alt="Avatar"
                className="w-6 h-6 rounded-full object-cover border border-white"
              />
              <span>{user?.email ? user.email.split('@')[0] : 'Olá, Julia!'}</span>
            </div>
          </div>

          {/* Conteúdo Central do Hero */}
          <div className="absolute inset-0 flex flex-col justify-end px-5 sm:px-8 lg:px-12 pb-12 max-w-7xl mx-auto">
            {/* Tag de Destino */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tropical-turquoise/30 backdrop-blur-md border border-tropical-turquoise/40 text-tropical-turquoise text-xs font-semibold tracking-wide uppercase mb-3 w-fit">
              <Compass className="w-3.5 h-3.5" />
              Destino Oficial da Turma
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-3xl drop-shadow-md">
              {trip?.title || 'Rota de Verão 2027'}
            </h1>

            <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mt-2 mb-6 font-normal leading-relaxed drop-shadow-sm">
              {trip?.description || 'Planejando juntos uma semana inesquecível de praia, descanso e passeios pelo litoral cearense com os melhores amigos.'}
            </p>

            {/* Metadados e Contagem Regressiva em Pills Translúcidas */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-xs">
                <MapPin className="w-4 h-4 text-tropical-sand-200 shrink-0" />
                <span>{trip?.destination} {trip?.state ? `— ${trip.state}` : ''}</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-xs">
                <Calendar className="w-4 h-4 text-tropical-sand-200 shrink-0" />
                <span>{trip?.start_date} a {trip?.end_date}</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-xs">
                <Users className="w-4 h-4 text-tropical-sand-200 shrink-0" />
                <span>{totalCount} participantes ({confirmedCount} confirmados)</span>
              </div>

              {daysUntilTrip !== null && daysUntilTrip > 0 && (
                <div className="flex items-center gap-1.5 bg-tropical-coral text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-tropical-sm animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>Faltam {daysUntilTrip} dias para a viagem!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: PROGRESSO DO PLANEJAMENTO EM PROPORÇÃO ASSIMÉTRICA ─────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl md:rounded-3xl border border-tropical-sand-border/50 shadow-tropical p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tropical-palm" />
              <h2 className="font-display font-bold text-base text-tropical-text">
                Progresso Geral da Viagem
              </h2>
            </div>
            <p className="text-xs text-tropical-text-muted">
              {confirmedCount} de {totalCount} participantes já confirmaram presença para curtir Fortaleza & Cumbuco.
            </p>
          </div>

          <div className="flex-1 max-w-lg space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-tropical-text">Taxa de Confirmação</span>
              <span className="text-tropical-ocean font-bold">{confirmationPct}%</span>
            </div>
            <div className="w-full bg-tropical-sand-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-tropical-sand-border/40">
              <div
                className="bg-gradient-to-r from-tropical-ocean to-tropical-turquoise h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${confirmationPct}%` }}
              />
            </div>
          </div>

          <Link
            to="/participantes"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-tropical-sm hover:shadow-tropical shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-tropical-turquoise" />
            <span>Confirmar Minha Presença</span>
          </Link>
        </div>
      </section>

      {/* ── SEÇÃO 3: CARDS DE SERVIÇO COM IDENTIDADE TROPICAL CONTEMPORÂNEA ─── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-tropical-text tracking-tight">
              Pilares da Viagem
            </h2>
            <p className="text-xs sm:text-sm text-tropical-text-muted">
              Acompanhe a definição de voos, casa de temporada e translado coletivo.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-tropical-ocean hover:text-tropical-ocean-600 flex items-center gap-1 group"
          >
            <span>Ver roteiro completo</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Grid com Proporções Variadas e Cartões Editoriais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card Passagens */}
          <div className="tropical-card overflow-hidden flex flex-col justify-between group">
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=80"
                  alt="Avião no céu de verão"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tropical-text/80 via-tropical-text/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="badge-tropical bg-white/90 backdrop-blur-md text-tropical-ocean border border-white/40 shadow-xs">
                    <Plane className="w-3 h-3 text-tropical-turquoise" />
                    Voos Sugeridos
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="text-[11px] font-semibold text-tropical-turquoise block uppercase tracking-wider">GRU &harr; FOR</span>
                  <p className="text-sm font-bold">São Paulo a Fortaleza</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-tropical-text-muted">A partir de</span>
                  <span className="text-2xl font-bold font-display text-tropical-text">
                    {cheapestFlight ? `R$ ${cheapestFlight.price.toLocaleString('pt-BR')}` : 'R$ 890'}
                  </span>
                </div>
                <p className="text-xs text-tropical-palm font-medium flex items-center gap-1 mb-4">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Tarifas monitoradas para o grupo
                </p>

                <div className="space-y-1.5 text-xs text-tropical-text-secondary border-t border-tropical-sand-border/40 pt-3">
                  <div className="flex justify-between">
                    <span>Opções cadastradas:</span>
                    <strong className="text-tropical-text">{flights.length > 0 ? flights.length : 4} voos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Companhias:</span>
                    <span className="font-medium">GOL e LATAM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to="/passagens"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-tropical-ocean/10 hover:bg-tropical-ocean text-tropical-ocean hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <span>Ver Voos & Horários</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Hospedagem */}
          <div className="tropical-card overflow-hidden flex flex-col justify-between group border-tropical-ocean/20">
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80"
                  alt="Casa na beira da praia em Cumbuco"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tropical-text/80 via-tropical-text/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="badge-tropical bg-tropical-coral text-white shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                    Opção Favorita
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="text-[11px] font-semibold text-tropical-sand-200 block uppercase tracking-wider">Cumbuco &bull; Pé na Areia</span>
                  <p className="text-sm font-bold truncate">
                    {bestAccommodation ? bestAccommodation.name : 'Villa Beira-Mar Cumbuco'}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-tropical-text-muted">Por pessoa (est.)</span>
                  <span className="text-2xl font-bold font-display text-tropical-ocean">
                    {bestAccommodation
                      ? `R$ ${(bestAccommodation.price_per_person_estimated ?? 980).toLocaleString('pt-BR')}`
                      : 'R$ 980'}
                  </span>
                </div>
                <p className="text-xs text-tropical-text-muted mb-4">
                  5 suítes privativas &bull; Piscina e churrasqueira
                </p>

                <div className="space-y-1.5 text-xs text-tropical-text-secondary border-t border-tropical-sand-border/40 pt-3">
                  <div className="flex justify-between">
                    <span>Capacidade total:</span>
                    <strong className="text-tropical-text">{bestAccommodation?.total_capacity || 12} pessoas</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Votação da casa:</span>
                    <span className="text-tropical-coral font-bold">Em andamento</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to="/hospedagem"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 text-white text-xs font-bold transition-all shadow-tropical-sm cursor-pointer"
              >
                <span>Conhecer a Casa & Fotos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Carros */}
          <div className="tropical-card overflow-hidden flex flex-col justify-between group">
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&q=80"
                  alt="Carro para aluguel e translado"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tropical-text/80 via-tropical-text/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="badge-tropical bg-white/90 backdrop-blur-md text-tropical-ocean border border-white/40 shadow-xs">
                    <Car className="w-3 h-3 text-tropical-palm" />
                    Translado & Passeios
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="text-[11px] font-semibold text-tropical-turquoise block uppercase tracking-wider">Mobilidade Livre</span>
                  <p className="text-sm font-bold">SUVs & Minivans</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-tropical-text-muted">Diária a partir de</span>
                  <span className="text-2xl font-bold font-display text-tropical-text">
                    {cheapestVehicle ? `R$ ${cheapestVehicle.daily_rate.toLocaleString('pt-BR')}` : 'R$ 185'}
                  </span>
                </div>
                <p className="text-xs text-tropical-palm font-medium flex items-center gap-1 mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Divisão apenas entre quem usar o carro
                </p>

                <div className="space-y-1.5 text-xs text-tropical-text-secondary border-t border-tropical-sand-border/40 pt-3">
                  <div className="flex justify-between">
                    <span>Retirada / Devolução:</span>
                    <strong className="text-tropical-text">Aeroporto de Fortaleza</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Locadoras cotadas:</span>
                    <span className="font-medium">Localiza e Movida</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to="/veiculos"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-tropical-ocean/10 hover:bg-tropical-ocean text-tropical-ocean hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <span>Ver Veículos & Vagas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── SEÇÃO 4: COMPOSIÇÃO ASSIMÉTRICA: NOSSA TURMA & ENQUETES ATIVAS ─── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Coluna 1: Nossa Turma & Confirmações (7 colunas) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-tropical-sand-border/50 shadow-tropical-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-tropical-turquoise-50 text-tropical-ocean flex items-center justify-center">
                    <Users className="w-5 h-5 text-tropical-ocean" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-tropical-text">
                      Nossa Turma na Viagem
                    </h3>
                    <p className="text-xs text-tropical-text-muted">
                      Lista de amigos convidados e confirmação de presença.
                    </p>
                  </div>
                </div>

                <Link
                  to="/participantes"
                  className="text-xs font-bold text-tropical-ocean hover:text-tropical-ocean-600 flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Status do Grupo */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="p-3 rounded-2xl bg-tropical-sand-50 border border-tropical-sand-border/40 text-center">
                  <span className="text-2xl font-display font-bold text-tropical-ocean">{totalCount}</span>
                  <span className="block text-[11px] font-semibold text-tropical-text-muted uppercase tracking-wider mt-0.5">Amigos</span>
                </div>

                <div className="p-3 rounded-2xl bg-tropical-palm-50 border border-tropical-palm-200 text-center">
                  <span className="text-2xl font-display font-bold text-tropical-palm">{confirmedCount}</span>
                  <span className="block text-[11px] font-semibold text-tropical-palm uppercase tracking-wider mt-0.5">Confirmados</span>
                </div>

                <div className="p-3 rounded-2xl bg-tropical-coral-50 border border-tropical-coral-200 text-center">
                  <span className="text-2xl font-display font-bold text-tropical-coral">
                    {members.filter(p => p.confirmation_status === 'pending').length}
                  </span>
                  <span className="block text-[11px] font-semibold text-tropical-coral uppercase tracking-wider mt-0.5">Pendentes</span>
                </div>
              </div>

              {/* Cluster de Avatares Elegante */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-tropical-text mb-3">Já confirmaram o embarque:</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {confirmedParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tropical-sand-50 border border-tropical-sand-border/50 text-xs font-medium text-tropical-text"
                    >
                      <img
                        src={p.profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={p.profile.nickname || p.profile.full_name}
                        className="w-6 h-6 rounded-full object-cover border border-white"
                      />
                      <span className="truncate max-w-[100px]">{p.profile.nickname || p.profile.full_name.split(' ')[0]}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-tropical-palm shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-tropical-sand-border/30 flex items-center justify-between">
              <span className="text-xs text-tropical-text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-tropical-coral" />
                Confirmações abertas para reservas
              </span>
              <Link
                to="/participantes"
                className="text-xs font-bold text-tropical-coral hover:underline"
              >
                Gerenciar casal / amigos &rarr;
              </Link>
            </div>
          </div>

          {/* Coluna 2: Enquete em Destaque (5 colunas) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-tropical-ocean-800 to-tropical-text text-white rounded-3xl p-6 shadow-tropical flex flex-col justify-between relative overflow-hidden">
            {/* Onda sutil no fundo */}
            <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-tropical-turquoise/10 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="badge-tropical bg-tropical-coral text-white text-[11px] font-bold">
                  Votação Aberta
                </span>
                <Link
                  to="/enquetes"
                  className="text-xs text-tropical-turquoise hover:text-white font-semibold flex items-center gap-1"
                >
                  Todas as enquetes <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <h3 className="font-display font-bold text-lg text-white mb-1">
                {openPoll?.title || 'Qual passeio bate-volta devemos incluir na programação?'}
              </h3>
              <p className="text-xs text-tropical-sand-200/80 mb-5 leading-relaxed">
                {openPoll?.description || 'Escolha um dia para conhecermos uma praia vizinha de buggy ou van com todo o grupo.'}
              </p>

              {/* Opções com Barras Animadas */}
              <div className="space-y-3 mb-6">
                {(openPoll?.options || [
                  { id: '1', title: 'Passeio pelas Falésias de Morro Branco', percentage: 48 },
                  { id: '2', title: 'Bate-volta em Canoa Quebrada', percentage: 32 },
                  { id: '3', title: 'Lagoinha e Lagoa das Almécegas', percentage: 20 },
                ]).slice(0, 3).map((opt) => (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white/90 truncate max-w-[80%]">{opt.title}</span>
                      <span className="font-bold text-tropical-turquoise">{opt.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-tropical-turquoise to-tropical-sand-200 h-full rounded-full transition-all duration-500"
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/enquetes"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-tropical-turquoise hover:bg-tropical-turquoise-400 text-tropical-text text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <span>Votar Nesta Enquete</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── SEÇÃO 5: TRANSPARÊNCIA E VALORES DO GRUPO ───────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl border border-tropical-sand-border/50 p-6 md:p-8 shadow-tropical-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-tropical-turquoise-50 flex items-center justify-center text-tropical-ocean shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-tropical-text">Divisão Justa de Custos</h4>
                <p className="text-xs text-tropical-text-muted mt-0.5 leading-relaxed">
                  Cálculo automático de cotas individuais. Cada um paga apenas o que realmente usa, sem taxas escondidas.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-tropical-sand-100 flex items-center justify-center text-tropical-coral shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-tropical-text">Acesso Privado & RLS</h4>
                <p className="text-xs text-tropical-text-muted mt-0.5 leading-relaxed">
                  Informações seguras no banco de dados. Somente amigos convidados acessam os dados da nossa viagem.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-tropical-palm-50 flex items-center justify-center text-tropical-palm shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-tropical-text">Decisões Democráticas</h4>
                <p className="text-xs text-tropical-text-muted mt-0.5 leading-relaxed">
                  Enquetes transparentes para escolha de passeios, restaurantes e casas. A maioria define os rumos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
