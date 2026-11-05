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
import { PageShell } from '../components/layout/PageShell';

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
    <PageShell className="space-y-6">
      
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-2xl text-slate-800">
              Dashboard da Viagem
            </h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              currentRole === 'admin'
                ? 'bg-cyan-100 text-cyan-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {currentRole === 'admin' ? 'Visão Administradora' : 'Visão Convidado'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {MOCK_TRIP.title} · {MOCK_TRIP.destination} ({MOCK_TRIP.startDate} a {MOCK_TRIP.endDate})
          </p>
        </div>

        {currentRole === 'admin' && (
          <Link to="/administracao">
            <Button size="md" variant="primary" icon={<ShieldCheck className="w-4 h-4 text-cyan-300" />}>
              Painel Administrativo
            </Button>
          </Link>
        )}
      </div>

      {/* Aviso da Organizadora */}
      <aside className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 text-sm">
          <h2 className="font-semibold text-amber-900">Aviso da Organizadora (Mariana)</h2>
          <p className="text-amber-800/90 mt-0.5 leading-relaxed">
            "Pessoal, favor votarem na opção final de hospedagem até o dia 20/11 para garantirmos a casa pé na areia com desconto de pré-reserva!"
          </p>
        </div>
      </aside>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presenças</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-slate-800">{confirmedParticipants.length}</span>
            <span className="text-xs text-slate-500 font-medium">de {MOCK_PARTICIPANTS.length}</span>
          </div>
          <div className="pt-1 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {confirmedParticipants.length} confirmados
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <Clock className="w-3.5 h-3.5" /> {pendingParticipants.length} pendentes
            </span>
          </div>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Casais Fechados</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-slate-800">{fullyConfirmedCouples.length}</span>
            <span className="text-xs text-slate-500 font-medium">de {MOCK_COUPLES.length} casais</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {MOCK_COUPLES.length - fullyConfirmedCouples.length} casais com respostas pendentes
          </p>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enquetes</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Vote className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-slate-800">
              {MOCK_POLLS.filter(p => !p.isClosed).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">votações abertas</span>
          </div>
          <Link to="/enquetes" className="pt-1 text-xs text-cyan-600 hover:underline font-semibold flex items-center gap-1">
            Votar agora <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card padding="md" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimativa</span>
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-500">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display text-slate-800">R$ 2.850</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">por pessoa · Casa + Carros + Gastos</p>
        </Card>
      </div>

      {/* Conteúdo principal: Votações + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna esquerda: Votações + Atalhos */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
              <Vote className="w-5 h-5 text-cyan-500" />
              Votações Decisivas da Viagem
            </h2>
            <Link to="/enquetes" className="text-xs font-semibold text-cyan-600 hover:underline">
              Ver todas ({MOCK_POLLS.length})
            </Link>
          </div>

          <div className="space-y-4">
            {MOCK_POLLS.map((poll) => (
              <Card key={poll.id} padding="md" className="space-y-4 border-l-4 border-l-cyan-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-display font-semibold text-sm text-slate-800">{poll.title}</h3>
                  <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>
                    Prazo: {poll.deadline}
                  </Badge>
                </div>

                <p className="text-slate-600 text-xs">{poll.description}</p>

                <div className="space-y-2">
                  {poll.options.map((opt) => (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{opt.title}</span>
                        <span className="text-cyan-700 font-bold">{opt.percentage}% ({opt.voteCount} votos)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <Link to="/enquetes">
                    <Button size="sm" variant="outline">
                      {poll.userVotedOptionId ? 'Alterar meu voto' : 'Registrar meu voto'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Acesso Rápido */}
          <div>
            <h3 className="font-display font-semibold text-base text-slate-800 mb-3">Acesso Rápido</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/hospedagem', icon: HomeIcon, label: 'Hospedagem', sub: '3 opções', color: 'bg-cyan-50 text-cyan-600' },
                { to: '/passagens',  icon: Plane,    label: 'Passagens',  sub: '4 voos',   color: 'bg-orange-50 text-orange-500' },
                { to: '/veiculos',   icon: Car,      label: 'Veículos',   sub: '2 carros', color: 'bg-cyan-50 text-cyan-600' },
                { to: '/financeiro', icon: Receipt,  label: 'Financeiro', sub: 'Rateio',   color: 'bg-emerald-50 text-emerald-700' },
              ].map(({ to, icon: Icon, label, sub, color }) => (
                <Link key={to} to={to}>
                  <Card padding="sm" hoverable className="text-center space-y-2">
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700">{label}</div>
                    <div className="text-[10px] text-slate-500">{sub}</div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita: Últimas atualizações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              Últimas Atualizações
            </h2>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
              Tempo Real
            </span>
          </div>

          <Card padding="md" className="space-y-0">
            <div className="divide-y divide-slate-100">
              {MOCK_ACTIVITY_LOGS.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{log.actorName}</span>
                    <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{log.action}:</span> {log.target}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center border-t border-slate-100 mt-3">
              <Link to="/participantes" className="text-xs font-semibold text-cyan-600 hover:underline inline-flex items-center gap-1">
                Ver lista de presenças <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          {/* Dica didática */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2 text-xs text-slate-700">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Dica (Marco 2 — Dados Fictícios)
            </div>
            <p className="leading-relaxed">
              No próximo marco, confirmações feitas pelos seus amigos atualizarão este feed instantaneamente via notificações do PostgreSQL!
            </p>
          </div>
        </div>

      </div>

    </PageShell>
  );
};
