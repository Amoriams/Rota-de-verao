import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Heart, 
  Info,
  Phone,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { tripService } from '../services/tripService';
import { memberService } from '../services/memberService';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { PageShell } from '../components/layout/PageShell';
import { TripMemberWithProfile, CoupleStatusView, ConfirmationStatus } from '../@types/database.types';

export const Participants: React.FC = () => {
  const { user, role } = useAuth();

  const [viewMode, setViewMode] = useState<'individual' | 'couples'>('couples');
  const [members, setMembers] = useState<TripMemberWithProfile[]>([]);
  const [couples, setCouples] = useState<CoupleStatusView[]>([]);
  const [tripId, setTripId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const loadParticipantsData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const trip = await tripService.getTrip();
      setTripId(trip.id);

      const [membersData, couplesData] = await Promise.all([
        memberService.getMembers(trip.id),
        memberService.getCouplesStatus(trip.id),
      ]);

      setMembers(membersData);
      setCouples(couplesData);
    } catch (err: unknown) {
      console.error('Falha ao carregar participantes:', err);
      if (isSupabaseConfigured) {
        setIsError(true);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar a lista de participantes do banco de dados.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipantsData();
  }, [loadParticipantsData]);

  // Alterna confirmação de presença com validação de permissão
  const handleToggleStatus = async (memberId: string, profileId: string, currentStatus: ConfirmationStatus) => {
    const nextStatus: ConfirmationStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';

    // Se o banco estiver configurado, valida se é a própria pessoa ou a administradora
    if (isSupabaseConfigured && user) {
      const isSelf = user.id === profileId;
      const isAdmin = role === 'admin';

      if (!isSelf && !isAdmin) {
        setFeedbackMsg({
          text: 'Você só pode alterar sua própria confirmação de presença.',
          type: 'warning',
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
        return;
      }
    }

    // Atualização otimista na interface
    setMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? {
              ...m,
              confirmation_status: nextStatus,
              confirmed_at: nextStatus === 'confirmed' ? new Date().toISOString() : null,
            }
          : m
      )
    );

    // Se o Supabase estiver configurado, persiste no banco
    if (isSupabaseConfigured) {
      try {
        await memberService.updateConfirmationStatus(memberId, nextStatus);
        setFeedbackMsg({
          text: nextStatus === 'confirmed' ? 'Presença confirmada com sucesso!' : 'Presença marcada como pendente.',
          type: 'success',
        });
        setTimeout(() => setFeedbackMsg(null), 3000);

        // Atualiza os dados consolidados dos casais
        if (tripId) {
          const updatedCouples = await memberService.getCouplesStatus(tripId);
          setCouples(updatedCouples);
        }
      } catch (err) {
        console.error('Erro ao atualizar presença no banco:', err);
        setFeedbackMsg({
          text: 'Falha ao sincronizar com o banco de dados. Revertendo.',
          type: 'warning',
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
        loadParticipantsData();
      }
    }
  };

  // Avaliação do status visual do casal a partir da View ou local
  const getCoupleBadge = (coupleStatus: string) => {
    switch (coupleStatus) {
      case 'confirmed':
        return {
          label: 'Casal Confirmado',
          variant: 'success' as const,
          description: 'Ambos confirmaram presença na viagem!',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'declined':
        return {
          label: 'Casal Recusado',
          variant: 'danger' as const,
          description: 'Ambos informaram que não poderão comparecer.',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
        };
      case 'partial':
        return {
          label: 'Casal Parcialmente Confirmado',
          variant: 'warning' as const,
          description: 'Um integrante confirmou e o outro está pendente.',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
        };
      default:
        return {
          label: 'Casal Pendente',
          variant: 'neutral' as const,
          description: 'Aguardando manifestação dos dois integrantes.',
          icon: <Clock className="w-4 h-4 text-slate-500" />,
        };
    }
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <PageShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center animate-pulse mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-display font-medium text-sm text-slate-600">
            Carregando lista de participantes... 🌊
          </p>
        </div>
      </PageShell>
    );
  }

  if (isError && isSupabaseConfigured) {
    return (
      <PageShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-800 mb-2">
            Erro ao carregar participantes
          </h2>
          <p className="text-slate-600 text-sm max-w-md mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={loadParticipantsData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      </PageShell>
    );
  }

  const confirmedTotal = members.filter(p => p.confirmation_status === 'confirmed').length;
  const pendingTotal = members.filter(p => p.confirmation_status === 'pending').length;
  const declinedTotal = members.filter(p => p.confirmation_status === 'declined').length;

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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === 'individual'
                  ? 'bg-coastal-ocean text-white shadow-coastal'
                  : 'text-coastal-ocean-700 hover:text-coastal-ocean'
              }`}
            >
              <Users className="w-4 h-4" />
              Visão Individual ({members.length})
            </button>
          </div>
        </div>

        {/* Feedback de Ação */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-2xl text-xs md:text-sm font-medium border flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs underline ml-2">Fechar</button>
          </div>
        )}

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
                {couples.length} Casais &bull; Cada parceiro confirma individualmente
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {couples.map((couple) => {
                const badge = getCoupleBadge(couple.couple_status);

                return (
                  <Card key={couple.couple_id} padding="lg" className="space-y-5 border-t-4 border-t-coastal-ocean">
                    
                    {/* Cabeçalho do Card do Casal */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          {couple.label}
                        </span>
                        <h3 className="font-display font-bold text-lg text-coastal-ocean mt-0.5">
                          {couple.member_a_nickname || couple.member_a_name.split(' ')[0]} & {couple.member_b_nickname || couple.member_b_name.split(' ')[0]}
                        </h3>
                      </div>
                      <Badge variant={badge.variant} size="md" icon={badge.icon}>
                        {badge.label}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {badge.description}
                    </p>

                    {/* Detalhe dos Dois Membros */}
                    <div className="space-y-3 pt-1">
                      
                      {/* Membro A */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/40">
                        <div className="flex items-center gap-3">
                          <img 
                            src={couple.member_a_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                            alt={couple.member_a_name} 
                            className="w-10 h-10 rounded-full object-cover border border-coastal-sand"
                          />
                          <div>
                            <div className="text-sm font-semibold text-coastal-ocean">
                              {couple.member_a_name}
                            </div>
                            <div className="text-xs text-slate-500">Parceiro A</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={couple.member_a_status === 'confirmed' ? 'success' : couple.member_a_status === 'declined' ? 'danger' : 'warning'} 
                            size="sm"
                          >
                            {couple.member_a_status === 'confirmed' ? 'Confirmada' : couple.member_a_status === 'declined' ? 'Recusada' : 'Pendente'}
                          </Badge>
                          {(() => {
                            const memberRow = members.find(m => m.profile_id === couple.member_a_id);
                            if (!memberRow) return null;
                            return (
                              <button
                                onClick={() => handleToggleStatus(memberRow.id, memberRow.profile_id, memberRow.confirmation_status)}
                                className="text-[11px] text-coastal-ocean underline font-medium hover:text-coastal-coral cursor-pointer"
                                title="Alternar status de presença"
                              >
                                Alternar
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Membro B */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/40">
                        <div className="flex items-center gap-3">
                          <img 
                            src={couple.member_b_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'} 
                            alt={couple.member_b_name} 
                            className="w-10 h-10 rounded-full object-cover border border-coastal-sand"
                          />
                          <div>
                            <div className="text-sm font-semibold text-coastal-ocean">
                              {couple.member_b_name}
                            </div>
                            <div className="text-xs text-slate-500">Parceiro B</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={couple.member_b_status === 'confirmed' ? 'success' : couple.member_b_status === 'declined' ? 'danger' : 'warning'} 
                            size="sm"
                          >
                            {couple.member_b_status === 'confirmed' ? 'Confirmada' : couple.member_b_status === 'declined' ? 'Recusada' : 'Pendente'}
                          </Badge>
                          {(() => {
                            const memberRow = members.find(m => m.profile_id === couple.member_b_id);
                            if (!memberRow) return null;
                            return (
                              <button
                                onClick={() => handleToggleStatus(memberRow.id, memberRow.profile_id, memberRow.confirmation_status)}
                                className="text-[11px] text-coastal-ocean underline font-medium hover:text-coastal-coral cursor-pointer"
                                title="Alternar status de presença"
                              >
                                Alternar
                              </button>
                            );
                          })()}
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
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <Users className="w-5 h-5 text-coastal-ocean" />
              Lista Individual de Convidados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id} padding="md" className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img 
                        src={member.profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                        alt={member.profile.full_name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-coastal-sand"
                      />
                      <div>
                        <div className="font-semibold text-sm text-coastal-ocean flex items-center gap-1.5">
                          {member.profile.full_name}
                          {member.role === 'admin' && (
                            <Badge variant="ocean" size="sm">Admin</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {member.profile.nickname ? `"${member.profile.nickname}"` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.profile.phone || 'Sem WhatsApp'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={member.confirmation_status === 'confirmed' ? 'success' : member.confirmation_status === 'declined' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {member.confirmation_status === 'confirmed' ? 'Confirmada' : member.confirmation_status === 'declined' ? 'Recusada' : 'Pendente'}
                      </Badge>
                      <button
                        onClick={() => handleToggleStatus(member.id, member.profile_id, member.confirmation_status)}
                        className="text-[11px] text-coastal-ocean underline font-medium hover:text-coastal-coral cursor-pointer"
                        title="Alternar status de confirmação"
                      >
                        Alternar
                      </button>
                    </div>
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
