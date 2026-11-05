import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Vote, 
  Receipt, 
  Clock, 
  Plane, 
  Car, 
  Home as HomeIcon, 
  ShieldCheck, 
  Bell, 
  Sun,
  Palmtree,
  Calendar,
  MapPin,
  Heart
} from 'lucide-react';
import { 
  MOCK_TRIP, 
  MOCK_PARTICIPANTS, 
  MOCK_COUPLES, 
  MOCK_POLLS, 
  MOCK_ACTIVITY_LOGS 
} from '../data/mockData';
import { useTrip } from '../contexts/TripContext';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';

interface DashboardProps {
  currentRole: 'admin' | 'member';
}

export const Dashboard: React.FC<DashboardProps> = ({ currentRole }) => {
  const { currentTrip } = useTrip();

  // Dados com prioridade para a viagem ativa selecionada
  const tripTitle = currentTrip?.title || MOCK_TRIP.title;
  const tripDestination = currentTrip ? [currentTrip.destination, currentTrip.city, currentTrip.state].filter(Boolean).join(', ') : MOCK_TRIP.destination;
  const tripDates = currentTrip?.start_date && currentTrip?.end_date 
    ? `${currentTrip.start_date} a ${currentTrip.end_date}` 
    : `${MOCK_TRIP.startDate} a ${MOCK_TRIP.endDate}`;
  const estimatedBudget = currentTrip?.estimated_budget_per_person ?? MOCK_TRIP.estimatedBudgetPerPerson;

  const confirmedParticipants = MOCK_PARTICIPANTS.filter(p => p.status === 'confirmed');

  const fullyConfirmedCouples = MOCK_COUPLES.filter(c => 
    c.memberA.status === 'confirmed' && c.memberB.status === 'confirmed'
  );

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── TOPO DA PÁGINA COM IDENTIDADE TROPICAL ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Palmtree className="w-3.5 h-3.5 text-tropical-ocean" />
              Visão Geral
            </span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text">
              Dashboard da Viagem
            </h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              currentRole === 'admin'
                ? 'bg-tropical-coral-50 text-tropical-coral border border-tropical-coral-200'
                : 'bg-tropical-sand-100 text-tropical-text-secondary border border-tropical-sand-border'
            }`}>
              {currentRole === 'admin' ? 'Visão: Administradora' : 'Visão: Convidada'}
            </span>
          </div>
          <p className="text-tropical-text-muted text-sm mt-1.5 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
            <span>{tripTitle} &bull; {tripDestination}</span>
            <span className="text-tropical-sand-border">&bull;</span>
            <Calendar className="w-3.5 h-3.5 text-tropical-turquoise" />
            <span>{tripDates}</span>
          </p>
        </div>

        {currentRole === 'admin' && (
          <Link to="/administracao">
            <Button size="md" variant="primary" icon={<ShieldCheck className="w-4 h-4 text-tropical-turquoise" />}>
              Painel Administrativo
            </Button>
          </Link>
        )}
      </div>

      {/* ── AVISO OFICIAL DA ORGANIZADORA ───────────────────────────────────── */}
      <aside className="bg-white rounded-3xl border border-tropical-sand-border/60 shadow-tropical-sm p-5 md:p-6 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-tropical-sand-100 text-tropical-text flex items-center justify-center shrink-0 shadow-xs">
          <Bell className="w-6 h-6 text-tropical-coral" />
        </div>
        <div className="flex-1 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-tropical-text">
              Comunicado da Organizadora (Mariana)
            </h2>
            <span className="text-[11px] font-semibold text-tropical-palm bg-tropical-palm-50 px-2 py-0.5 rounded-full border border-tropical-palm-200">
              Aviso Importante
            </span>
          </div>
          <p className="text-tropical-text-secondary text-sm leading-relaxed">
            "Pessoal, favor votarem na opção final de hospedagem até o dia 20/11 para garantirmos a casa pé na areia com desconto de pré-reserva! Quem precisar de carona do aeroporto, confira a aba de carros."
          </p>
        </div>
        <Link
          to="/enquetes"
          className="self-end sm:self-center px-4 py-2 rounded-xl bg-tropical-coral text-white text-xs font-bold hover:bg-tropical-coral-500 transition-colors shadow-tropical-sm shrink-0"
        >
          Votar Agora &rarr;
        </Link>
      </aside>

      {/* ── GRID DE MÉTRICAS & INDICADORES DO GRUPO ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card 1: Presenças */}
        <div className="tropical-card p-5 space-y-2 border-l-4 border-l-tropical-palm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Presenças</span>
            <span className="p-2 rounded-xl bg-tropical-palm-50 text-tropical-palm">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-tropical-text">{confirmedParticipants.length}</span>
            <span className="text-xs text-tropical-text-muted font-medium">de {MOCK_PARTICIPANTS.length} confirmados</span>
          </div>
          <div className="w-full bg-tropical-sand-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-tropical-palm h-1.5 rounded-full"
              style={{ width: `${Math.round((confirmedParticipants.length / MOCK_PARTICIPANTS.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Casais */}
        <div className="tropical-card p-5 space-y-2 border-l-4 border-l-tropical-coral">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Casais 100%</span>
            <span className="p-2 rounded-xl bg-tropical-coral-50 text-tropical-coral">
              <Heart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-tropical-text">{fullyConfirmedCouples.length}</span>
            <span className="text-xs text-tropical-text-muted font-medium">de {MOCK_COUPLES.length} casais</span>
          </div>
          <p className="text-[11px] text-tropical-text-secondary">
            Confirmação mútua para quartos
          </p>
        </div>

        {/* Card 3: Enquetes */}
        <div className="tropical-card p-5 space-y-2 border-l-4 border-l-tropical-ocean">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Votações</span>
            <span className="p-2 rounded-xl bg-tropical-turquoise-50 text-tropical-ocean">
              <Vote className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-tropical-text">{MOCK_POLLS.filter(p => !p.isClosed).length}</span>
            <span className="text-xs text-tropical-text-muted font-medium">enquete aberta</span>
          </div>
          <p className="text-[11px] text-tropical-turquoise-700 font-medium">
            Escolha da casa e passeios
          </p>
        </div>

        {/* Card 4: Estimativa de Custo */}
        <div className="tropical-card p-5 space-y-2 border-l-4 border-l-tropical-turquoise">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Custo Previsto</span>
            <span className="p-2 rounded-xl bg-tropical-sand-100 text-tropical-text">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-display text-tropical-text">
              R$ {estimatedBudget ? estimatedBudget.toLocaleString('pt-BR') : '0,00'}
            </span>
          </div>
          <p className="text-[11px] text-tropical-text-secondary">
            Por pessoa (casa + carro + voo)
          </p>
        </div>

      </div>

      {/* ── SEÇÃO DE DESTAQUE: ITINERÁRIO & ATIVIDADES PREVISTAS ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Roteiro da Viagem (8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-tropical-sand-border/50 shadow-tropical-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-tropical-sand-border/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-tropical-turquoise-50 flex items-center justify-center text-tropical-ocean">
                <Sun className="w-5 h-5 text-tropical-ocean" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-tropical-text">
                  Cronograma & Destaques da Viagem
                </h3>
                <p className="text-xs text-tropical-text-muted">
                  Os principais marcos da nossa estadia no Ceará.
                </p>
              </div>
            </div>
            <span className="badge-tropical bg-tropical-sand-100 text-tropical-text-secondary">
              7 Dias no Paraíso
            </span>
          </div>

          {/* Timeline da Viagem */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/50 border border-tropical-sand-border/40">
              <div className="w-10 h-10 rounded-xl bg-tropical-ocean text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-tropical-sm">
                Dia 1
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <strong className="text-tropical-text font-bold">15 de Janeiro &bull; Embarque e Chegada</strong>
                  <span className="text-[11px] text-tropical-palm font-semibold">GRU &rarr; FOR</span>
                </div>
                <p className="text-tropical-text-secondary text-xs mt-1">
                  Chegada no Aeroporto Pinto Martins em Fortaleza, retirada dos veículos com a turma e translado direto para Cumbuco.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/50 border border-tropical-sand-border/40">
              <div className="w-10 h-10 rounded-xl bg-tropical-turquoise text-tropical-text flex items-center justify-center font-bold text-xs shrink-0 shadow-tropical-sm">
                Dia 2
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <strong className="text-tropical-text font-bold">16 de Janeiro &bull; Praia do Cumbuco & Dunas</strong>
                  <span className="text-[11px] text-tropical-coral font-semibold">Buggy com emoção</span>
                </div>
                <p className="text-tropical-text-secondary text-xs mt-1">
                  Manhã livre de praia pé na areia na casa e passeio clássico de buggy pelas lagoas e dunas à tarde.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/50 border border-tropical-sand-border/40">
              <div className="w-10 h-10 rounded-xl bg-tropical-coral text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-tropical-sm">
                Dia 4
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <strong className="text-tropical-text font-bold">18 de Janeiro &bull; Passeio Bate-Volta</strong>
                  <span className="text-[11px] text-tropical-ocean font-semibold">Em votação</span>
                </div>
                <p className="text-tropical-text-secondary text-xs mt-1">
                  Dia reservado para a opção mais votada na enquete oficial (Morro Branco, Canoa Quebrada ou Lagoinha).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-tropical-sand-50/50 border border-tropical-sand-border/40">
              <div className="w-10 h-10 rounded-xl bg-tropical-palm text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-tropical-sm">
                Dia 7
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <strong className="text-tropical-text font-bold">22 de Janeiro &bull; Despedida & Retorno</strong>
                  <span className="text-[11px] text-tropical-text font-semibold">Check-out 12h</span>
                </div>
                <p className="text-tropical-text-secondary text-xs mt-1">
                  Último banho de mar, almoço de encerramento em Fortaleza e embarque para São Paulo no final da tarde.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Ações Rápidas & Registro de Atividades (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Atalhos Rápidos */}
          <div className="bg-white rounded-3xl border border-tropical-sand-border/50 shadow-tropical-sm p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-tropical-text uppercase tracking-wider">
              Acesso Rápido aos Módulos
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/hospedagem"
                className="p-3 rounded-2xl bg-tropical-sand-50/60 hover:bg-tropical-sand-100/70 border border-tropical-sand-border/40 transition-colors flex flex-col items-center text-center gap-1.5 group"
              >
                <HomeIcon className="w-5 h-5 text-tropical-ocean transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-tropical-text">Hospedagem</span>
              </Link>

              <Link
                to="/passagens"
                className="p-3 rounded-2xl bg-tropical-sand-50/60 hover:bg-tropical-sand-100/70 border border-tropical-sand-border/40 transition-colors flex flex-col items-center text-center gap-1.5 group"
              >
                <Plane className="w-5 h-5 text-tropical-turquoise transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-tropical-text">Passagens</span>
              </Link>

              <Link
                to="/veiculos"
                className="p-3 rounded-2xl bg-tropical-sand-50/60 hover:bg-tropical-sand-100/70 border border-tropical-sand-border/40 transition-colors flex flex-col items-center text-center gap-1.5 group"
              >
                <Car className="w-5 h-5 text-tropical-palm transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-tropical-text">Carros</span>
              </Link>

              <Link
                to="/financeiro"
                className="p-3 rounded-2xl bg-tropical-sand-50/60 hover:bg-tropical-sand-100/70 border border-tropical-sand-border/40 transition-colors flex flex-col items-center text-center gap-1.5 group"
              >
                <Receipt className="w-5 h-5 text-tropical-coral transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-tropical-text">Financeiro</span>
              </Link>
            </div>
          </div>

          {/* Atividades Recentes do Grupo */}
          <div className="bg-white rounded-3xl border border-tropical-sand-border/50 shadow-tropical-sm p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-tropical-text uppercase tracking-wider flex items-center justify-between">
              <span>Últimas Atualizações</span>
              <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />
            </h3>

            <div className="space-y-2.5 text-xs">
              {MOCK_ACTIVITY_LOGS.slice(0, 3).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-tropical-sand-50/40 border border-tropical-sand-border/30 space-y-0.5">
                  <div className="flex items-center justify-between text-tropical-text-muted text-[10px]">
                    <span className="font-semibold text-tropical-ocean">{log.actorName}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-tropical-text font-medium text-xs">
                    {log.action} em <span className="font-mono">{log.target}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </PageShell>
  );
};
