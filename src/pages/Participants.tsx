import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Heart, 
  Info,
  Phone
} from 'lucide-react';
import { MOCK_PARTICIPANTS, MOCK_COUPLES } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Participant, Couple } from '../types';
import { PageShell } from '../components/layout/PageShell';

export const Participants: React.FC = () => {
  const [viewMode, setViewMode] = useState<'individual' | 'couples'>('couples');
  const [participantsList, setParticipantsList] = useState<Participant[]>(MOCK_PARTICIPANTS);

  // Função para simular confirmação de presença individual no Marco 2
  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    setParticipantsList(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
  };

  // Avaliação do status do casal
  const getCoupleStatus = (couple: Couple) => {
    const memberA = participantsList.find(p => p.id === couple.memberA.id) || couple.memberA;
    const memberB = participantsList.find(p => p.id === couple.memberB.id) || couple.memberB;

    if (memberA.status === 'confirmed' && memberB.status === 'confirmed') {
      return {
        label: 'Casal Confirmado',
        variant: 'success' as const,
        description: 'Ambos confirmaram presença na viagem!',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      };
    }
    if (memberA.status === 'declined' && memberB.status === 'declined') {
      return {
        label: 'Casal Recusado',
        variant: 'danger' as const,
        description: 'Ambos informaram que não poderão comparecer.',
        icon: <XCircle className="w-4 h-4 text-rose-600" />,
      };
    }
    if (memberA.status === 'confirmed' || memberB.status === 'confirmed') {
      const confirmedName = memberA.status === 'confirmed' ? memberA.name : memberB.name;
      const pendingName = memberA.status === 'pending' ? memberA.name : memberB.name;
      return {
        label: 'Casal Parcialmente Confirmado',
        variant: 'warning' as const,
        description: `${confirmedName} já confirmou, aguardando ${pendingName}.`,
        icon: <Clock className="w-4 h-4 text-amber-600" />,
      };
    }
    return {
      label: 'Casal Pendente',
      variant: 'neutral' as const,
      description: 'Aguardando manifestação dos dois integrantes.',
      icon: <Clock className="w-4 h-4 text-slate-500" />,
    };
  };

  const confirmedTotal = participantsList.filter(p => p.status === 'confirmed').length;
  const pendingTotal = participantsList.filter(p => p.status === 'pending').length;
  const declinedTotal = participantsList.filter(p => p.status === 'declined').length;

  return (
    <PageShell>
    <div className="space-y-8">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Participantes & Confirmações
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Gestão transparente de presenças individuais com acompanhamento consolidado por casais.
          </p>
        </div>

        {/* Alternador de Modo de Visualização */}
        <div className="inline-flex p-1 rounded-2xl bg-coastal-sand-light/80 border border-coastal-sand-border self-start md:self-auto shadow-xs">
          <button
            onClick={() => setViewMode('couples')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              viewMode === 'couples'
                ? 'bg-coastal-ocean text-white shadow-coastal'
                : 'text-coastal-ocean-700 hover:text-coastal-ocean'
            }`}
          >
            <Heart className="w-4 h-4" />
            Visão por Casais
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              viewMode === 'individual'
                ? 'bg-coastal-ocean text-white shadow-coastal'
                : 'text-coastal-ocean-700 hover:text-coastal-ocean'
            }`}
          >
            <Users className="w-4 h-4" />
            Visão Individual ({participantsList.length})
          </button>
        </div>
      </div>

      {/* Alerta de Regra de Negócio: Presença não é Pagamento */}
      <aside aria-label="Informações sobre confirmação e regras de negócio" className="bg-coastal-ocean-50 border border-coastal-ocean-200 rounded-2xl p-4 md:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-coastal-ocean shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-coastal-ocean-800 leading-relaxed space-y-1">
          <p className="font-semibold text-coastal-ocean-900">
            Regra Fundamental: Confirmação de presença não é cobrança!
          </p>
          <p>
            Confirmar presença indica apenas o compromisso pessoal de viajar junto com o grupo.
            A compra de passagens, reserva da casa e transferências são etapas separadas que você acompanha na aba <strong className="font-semibold">Financeiro</strong>.
          </p>
        </div>
      </aside>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <Card padding="sm" className="text-center md:text-left border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Confirmados</div>
          <div className="text-2xl md:text-3xl font-bold font-display text-emerald-700 mt-1">
            {confirmedTotal}
          </div>
          <div className="text-[11px] text-slate-500 hidden md:block">Vão viajar com certeza</div>
        </Card>

        <Card padding="sm" className="text-center md:text-left border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Pendentes</div>
          <div className="text-2xl md:text-3xl font-bold font-display text-amber-700 mt-1">
            {pendingTotal}
          </div>
          <div className="text-[11px] text-slate-500 hidden md:block">Aguardando resposta</div>
        </Card>

        <Card padding="sm" className="text-center md:text-left border-l-4 border-l-rose-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Não poderão ir</div>
          <div className="text-2xl md:text-3xl font-bold font-display text-rose-700 mt-1">
            {declinedTotal}
          </div>
          <div className="text-[11px] text-slate-500 hidden md:block">Desistências registradas</div>
        </Card>
      </div>

      {/* VISÃO 1: RESUMO CONSOLIDADO POR CASAIS */}
      {viewMode === 'couples' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <Heart className="w-5 h-5 text-coastal-coral" />
              Acompanhamento de Casais Cadastrados
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              4 Casais &bull; Cada parceiro confirma individualmente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_COUPLES.map((couple) => {
              const coupleStatus = getCoupleStatus(couple);
              const memberA = participantsList.find(p => p.id === couple.memberA.id) || couple.memberA;
              const memberB = participantsList.find(p => p.id === couple.memberB.id) || couple.memberB;

              return (
                <Card key={couple.id} padding="lg" className="space-y-5 border-t-4 border-t-coastal-ocean">
                  
                  {/* Cabeçalho do Card do Casal */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        {couple.label}
                      </span>
                      <h3 className="font-display font-bold text-lg text-coastal-ocean mt-0.5">
                        {memberA.name.split(' ')[0]} & {memberB.name.split(' ')[0]}
                      </h3>
                    </div>
                    <Badge variant={coupleStatus.variant} size="md" icon={coupleStatus.icon}>
                      {coupleStatus.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {coupleStatus.description}
                  </p>

                  {/* Detalhe dos Dois Membros */}
                  <div className="space-y-3 pt-1">
                    
                    {/* Membro A */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/40">
                      <div className="flex items-center gap-3">
                        <img 
                          src={memberA.avatarUrl} 
                          alt={memberA.name} 
                          className="w-10 h-10 rounded-full object-cover border border-coastal-sand"
                        />
                        <div>
                          <div className="text-sm font-semibold text-coastal-ocean">
                            {memberA.name}
                            {memberA.role === 'admin' && (
                              <span className="ml-1.5 text-[10px] text-coastal-coral font-bold uppercase">(Admin)</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{memberA.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={memberA.status === 'confirmed' ? 'success' : memberA.status === 'declined' ? 'danger' : 'warning'} 
                          size="sm"
                        >
                          {memberA.status === 'confirmed' ? 'Confirmada' : memberA.status === 'declined' ? 'Recusada' : 'Pendente'}
                        </Badge>
                        <button
                          onClick={() => handleToggleStatus(memberA.id, memberA.status)}
                          className="text-[11px] text-coastal-ocean underline font-medium hover:text-coastal-coral"
                          title="Simular alteração de confirmação"
                        >
                          Alternar
                        </button>
                      </div>
                    </div>

                    {/* Membro B */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/40">
                      <div className="flex items-center gap-3">
                        <img 
                          src={memberB.avatarUrl} 
                          alt={memberB.name} 
                          className="w-10 h-10 rounded-full object-cover border border-coastal-sand"
                        />
                        <div>
                          <div className="text-sm font-semibold text-coastal-ocean">
                            {memberB.name}
                          </div>
                          <div className="text-xs text-slate-500">{memberB.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={memberB.status === 'confirmed' ? 'success' : memberB.status === 'declined' ? 'danger' : 'warning'} 
                          size="sm"
                        >
                          {memberB.status === 'confirmed' ? 'Confirmado' : memberB.status === 'declined' ? 'Recusado' : 'Pendente'}
                        </Badge>
                        <button
                          onClick={() => handleToggleStatus(memberB.id, memberB.status)}
                          className="text-[11px] text-coastal-ocean underline font-medium hover:text-coastal-coral"
                          title="Simular alteração de confirmação"
                        >
                          Alternar
                        </button>
                      </div>
                    </div>

                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* VISÃO 2: LISTA INDIVIDUAL COMPLETA */}
      {viewMode === 'individual' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <Users className="w-5 h-5 text-coastal-ocean" />
              Lista Geral de Convidados
            </h2>
            <span className="text-xs text-slate-500">
              Total de {participantsList.length} pessoas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participantsList.map((participant) => (
              <Card key={participant.id} padding="md" className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={participant.avatarUrl}
                    alt={participant.name}
                    className="w-12 h-12 rounded-full object-cover border border-coastal-sand shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-coastal-ocean truncate">
                      {participant.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {participant.phone || 'Sem telefone'}
                    </p>
                    {participant.confirmedAt && (
                      <p className="text-[10px] text-emerald-700 mt-0.5">
                        Confirmado em {participant.confirmedAt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge
                    variant={
                      participant.status === 'confirmed'
                        ? 'success'
                        : participant.status === 'declined'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {participant.status === 'confirmed' ? 'Confirmado' : participant.status === 'declined' ? 'Recusado' : 'Pendente'}
                  </Badge>
                  <button
                    onClick={() => handleToggleStatus(participant.id, participant.status)}
                    className="text-[10px] text-coastal-ocean underline hover:text-coastal-coral"
                  >
                    Simular troca
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
    </PageShell>
  );
};
