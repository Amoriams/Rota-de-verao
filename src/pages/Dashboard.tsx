import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Vote, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Plane, 
  Car, 
  Home as HomeIcon, 
  ShieldCheck, 
  ChevronRight, 
  Bell, 
  AlertCircle 
} from 'lucide-react';
import { 
  MOCK_TRIP, 
  MOCK_PARTICIPANTS, 
  MOCK_COUPLES, 
  MOCK_POLLS, 
  MOCK_ACTIVITY_LOGS 
} from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface DashboardProps {
  currentRole: 'admin' | 'member';
}

export const Dashboard: React.FC<DashboardProps> = ({ currentRole }) => {
  const confirmedParticipants = MOCK_PARTICIPANTS.filter(p => p.status === 'confirmed');
  const pendingParticipants = MOCK_PARTICIPANTS.filter(p => p.status === 'pending');

  // Casais 100% confirmados (ambos confirmaram)
  const fullyConfirmedCouples = MOCK_COUPLES.filter(c => 
    c.memberA.status === 'confirmed' && c.memberB.status === 'confirmed'
  );

  return (
    <div className="space-y-8">
      
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
              Dashboard da Viagem
            </h1>
            <Badge variant="ocean" size="sm">
              {currentRole === 'admin' ? 'Visão Administradora' : 'Visão Convidado'}
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            {MOCK_TRIP.title} &bull; {MOCK_TRIP.destination} ({MOCK_TRIP.startDate} a {MOCK_TRIP.endDate})
          </p>
        </div>

        {currentRole === 'admin' && (
          <div className="flex items-center gap-2">
            <Link to="/administracao">
              <Button size="md" variant="primary" icon={<ShieldCheck className="w-4 h-4 text-coastal-coral" />}>
                Painel Administrativo
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Aviso Importante da Organizadora */}
      <aside aria-label="Aviso da organizadora" className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 text-sm">
          <h2 className="font-semibold text-amber-900">
            Aviso da Organizadora (Mariana)
          </h2>
          <p className="text-amber-800/90 mt-0.5 leading-relaxed">
            "Pessoal, favor votarem na opção final de hospedagem até o dia 20/11 para garantirmos a casa pé na areia com desconto de pré-reserva!"
          </p>
        </div>
      </aside>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card: Confirmação de Presenças */}
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Presenças
            </span>
            <span className="p-1.5 rounded-lg bg-coastal-ocean-50 text-coastal-ocean">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-coastal-ocean">
              {confirmedParticipants.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {MOCK_PARTICIPANTS.length} convidados
            </span>
          </div>
          <div className="pt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {confirmedParticipants.length} confirmados
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <Clock className="w-3.5 h-3.5" /> {pendingParticipants.length} pendentes
            </span>
          </div>
        </Card>

        {/* Card: Casais 100% Confirmados */}
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Casais Fechados
            </span>
            <span className="p-1.5 rounded-lg bg-coastal-water-light/60 text-coastal-ocean">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-coastal-ocean">
              {fullyConfirmedCouples.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {MOCK_COUPLES.length} casais
            </span>
          </div>
          <p className="text-xs text-slate-500 pt-2">
            {MOCK_COUPLES.length - fullyConfirmedCouples.length} casais ainda com respostas pendentes
          </p>
        </Card>

        {/* Card: Votações em Aberto */}
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enquetes Ativas
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-coastal-water-dark">
              <Vote className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-coastal-ocean">
              {MOCK_POLLS.filter(p => !p.isClosed).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              votações aguardando
            </span>
          </div>
          <Link to="/enquetes" className="pt-2 text-xs text-coastal-water-dark hover:underline font-semibold flex items-center gap-1">
            Votar agora <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Card: Estimativa Financeira */}
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimativa / Pessoa
            </span>
            <span className="p-1.5 rounded-lg bg-orange-50 text-coastal-coral">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-coastal-ocean">
              R$ 2.850
            </span>
          </div>
          <p className="text-xs text-slate-500 pt-2">
            Casa + Carros + Gastos comuns previstos
          </p>
        </Card>

      </div>

      {/* Seção Central: Ações Rápidas & Enquetes em Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Enquetes Abertas & Próximos Acontecimentos */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <Vote className="w-5 h-5 text-coastal-water-dark" />
              Votações Decisivas da Viagem
            </h2>
            <Link to="/enquetes" className="text-xs font-semibold text-coastal-ocean hover:underline">
              Ver todas ({MOCK_POLLS.length})
            </Link>
          </div>

          <div className="space-y-4">
            {MOCK_POLLS.map((poll) => (
              <Card key={poll.id} padding="md" className="space-y-4 border-l-4 border-l-coastal-ocean">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-display font-semibold text-base text-coastal-ocean">
                    {poll.title}
                  </h3>
                  <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>
                    Prazo: {poll.deadline}
                  </Badge>
                </div>

                <p className="text-slate-600 text-xs md:text-sm">
                  {poll.description}
                </p>

                {/* Opções Parciais */}
                <div className="space-y-2">
                  {poll.options.map((opt) => (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{opt.title}</span>
                        <span className="text-coastal-ocean font-bold">{opt.percentage}% ({opt.voteCount} votos)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-coastal-ocean h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Link to="/enquetes">
                    <Button size="sm" variant="outline">
                      {poll.userVotedOptionId ? 'Alterar meu voto' : 'Registrar meu voto'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Atalhos para os Módulos */}
          <div className="pt-4">
            <h3 className="font-display font-semibold text-lg text-coastal-ocean mb-4">
              Acesso Rápido aos Módulos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/hospedagem">
                <Card padding="sm" hoverable className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-coastal-ocean-50 text-coastal-ocean flex items-center justify-center">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-coastal-ocean">Hospedagem</div>
                  <div className="text-[10px] text-slate-500">3 opções</div>
                </Card>
              </Link>

              <Link to="/passagens">
                <Card padding="sm" hoverable className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-orange-50 text-coastal-coral flex items-center justify-center">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-coastal-ocean">Passagens</div>
                  <div className="text-[10px] text-slate-500">4 voos</div>
                </Card>
              </Link>

              <Link to="/veiculos">
                <Card padding="sm" hoverable className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-50 text-coastal-water-dark flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-coastal-ocean">Veículos</div>
                  <div className="text-[10px] text-slate-500">2 carros</div>
                </Card>
              </Link>

              <Link to="/financeiro">
                <Card padding="sm" hoverable className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-coastal-ocean">Financeiro</div>
                  <div className="text-[10px] text-slate-500">Rateio claro</div>
                </Card>
              </Link>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Feed de Auditoria & Atualizações Recentes */}
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <Clock className="w-5 h-5 text-coastal-ocean" />
              Últimas Atualizações
            </h2>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
              Tempo Real
            </span>
          </div>

          <Card padding="md" className="space-y-4">
            <div className="divide-y divide-slate-100">
              {MOCK_ACTIVITY_LOGS.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-coastal-ocean">
                      {log.actorName}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{log.action}:</span> {log.target}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center border-t border-slate-100">
              <Link to="/participantes" className="text-xs font-semibold text-coastal-ocean hover:underline inline-flex items-center gap-1">
                Ver lista completa de presenças <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          {/* Dica Didática para a Organizadora */}
          <div className="p-4 rounded-2xl bg-coastal-sand-light/60 border border-coastal-sand-border space-y-2 text-xs text-slate-700">
            <div className="font-semibold text-coastal-ocean-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-coastal-coral" />
              Dica da Arquitetura (Marco 2)
            </div>
            <p className="leading-relaxed">
              No próximo marco, cada confirmação feita pelos seus amigos atualizará este feed e os contadores instantaneamente através das notificações em tempo real do PostgreSQL!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
