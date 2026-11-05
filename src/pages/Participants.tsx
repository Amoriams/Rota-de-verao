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
  RotateCcw,
  Sparkles,
  Palmtree,
  Shield
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { tripService } from '../services/tripService';
import { memberService } from '../services/memberService';
import { Badge } from '../components/common/Badge';
import { PageShell } from '../components/layout/PageShell';
import { TripMemberWithProfile, CoupleStatusView, ConfirmationStatus } from '../@types/database.types';

export const Participants: React.FC = () => {
  const { user, role } = useAuth();
  const { currentTrip } = useTrip();

  const [viewMode, setViewMode] = useState<'couples' | 'individual'>('couples');
  const [members, setMembers] = useState<TripMemberWithProfile[]>([]);
  const [couples, setCouples] = useState<CoupleStatusView[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const loadParticipantsData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const trip = currentTrip || await tripService.getTrip();

      if (!trip) {
        // Sem viagem ativa — mantém estado vazio
        setTripId(null);
        setMembers([]);
        setCouples([]);
        return;
      }

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
  }, [loadParticipantsData, currentTrip?.id]);

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

  // Avaliação do status visual do casal
  const getCoupleBadge = (coupleStatus: string) => {
    switch (coupleStatus) {
      case 'confirmed':
        return {
          label: 'Casal Confirmado',
          variant: 'palm' as const,
          description: 'Ambos confirmaram presença na viagem!',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-tropical-palm" />,
        };
      case 'declined':
        return {
          label: 'Casal Recusado',
          variant: 'danger' as const,
          description: 'Ambos informaram que não poderão comparecer.',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      case 'partial':
        return {
          label: 'Parcialmente Confirmado',
          variant: 'coral' as const,
          description: 'Um integrante confirmou e o outro está pendente.',
          icon: <Clock className="w-3.5 h-3.5 text-tropical-coral" />,
        };
      default:
        return {
          label: 'Aguardando Casal',
          variant: 'sand' as const,
          description: 'Aguardando confirmação dos dois integrantes.',
          icon: <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />,
        };
    }
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <PageShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-tropical-bg">
          <div className="w-12 h-12 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center animate-pulse mb-3">
            <Users className="w-6 h-6 text-tropical-ocean" />
          </div>
          <p className="font-display font-medium text-sm text-tropical-text-secondary">
            Carregando lista de participantes e casais... 🌊
          </p>
        </div>
      </PageShell>
    );
  }

  if (isError && isSupabaseConfigured) {
    return (
      <PageShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-tropical-bg">
          <div className="w-16 h-16 rounded-3xl bg-tropical-coral-50 text-tropical-coral flex items-center justify-center mb-4 border border-tropical-coral-200 shadow-tropical-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-tropical-text mb-2">
            Erro ao carregar participantes
          </h2>
          <p className="text-tropical-text-muted text-sm max-w-md mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={loadParticipantsData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 text-white font-semibold text-sm transition-all shadow-tropical cursor-pointer active:scale-95"
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
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA COM SELETOR DE VISÃO ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-palm-50 text-tropical-palm border border-tropical-palm-200">
              <Palmtree className="w-3.5 h-3.5" />
              Grupo da Viagem
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Participantes & Casais
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Acompanhe quem já garantiu presença, casais organizados e quartos privativos.
          </p>
        </div>

        {/* Alternador de Modo de Visualização */}
        <div className="inline-flex p-1 rounded-2xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm self-start md:self-auto">
          <button
            onClick={() => setViewMode('couples')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'couples'
                ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                : 'text-tropical-text-secondary hover:text-tropical-ocean hover:bg-tropical-sand-50'
            }`}
          >
            <Heart className="w-4 h-4 text-tropical-coral" />
            Visão por Casais
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'individual'
                ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                : 'text-tropical-text-secondary hover:text-tropical-ocean hover:bg-tropical-sand-50'
            }`}
          >
            <Users className="w-4 h-4 text-tropical-turquoise" />
            Visão Individual ({members.length})
          </button>
        </div>
      </div>

      {/* Feedback de Ação Flutuante */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm font-semibold border flex items-center justify-between shadow-tropical-sm animate-slide-up ${
            feedbackMsg.type === 'success'
              ? 'bg-tropical-palm-50 border-tropical-palm-200 text-tropical-palm-600'
              : 'bg-tropical-coral-50 border-tropical-coral-200 text-tropical-coral-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {feedbackMsg.text}
          </span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs underline ml-2 cursor-pointer">Fechar</button>
        </div>
      )}

      {/* Alerta de Regra de Negócio: Presença não é Pagamento */}
      <aside aria-label="Informações sobre confirmação e regras de negócio" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-turquoise-50 text-tropical-ocean flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-5 h-5 text-tropical-ocean" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Regra de Transparência: Confirmar presença não gera cobrança imediata!
          </p>
          <p className="text-tropical-text-muted">
            Confirmar presença indica apenas que você fará parte do grupo para reservas de hospedagem e carros.
            Pagamentos de despesas compartilhadas são gerenciados de forma transparente no módulo <strong>Financeiro</strong>.
          </p>
        </div>
      </aside>

      {/* Resumo Estatístico em 3 Indicadores Tropicais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="tropical-card p-5 border-l-4 border-l-tropical-palm space-y-1">
          <div className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Confirmados</div>
          <div className="text-3xl font-extrabold font-display text-tropical-palm">
            {confirmedTotal}
          </div>
          <div className="text-xs text-tropical-text-muted">Vão viajar com certeza 🌊</div>
        </div>

        <div className="tropical-card p-5 border-l-4 border-l-tropical-coral space-y-1">
          <div className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Pendentes</div>
          <div className="text-3xl font-extrabold font-display text-tropical-coral">
            {pendingTotal}
          </div>
          <div className="text-xs text-tropical-text-muted">Aguardando manifestação</div>
        </div>

        <div className="tropical-card p-5 border-l-4 border-l-slate-400 space-y-1">
          <div className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">Não poderão ir</div>
          <div className="text-3xl font-extrabold font-display text-slate-600">
            {declinedTotal}
          </div>
          <div className="text-xs text-tropical-text-muted">Desistências registradas</div>
        </div>
      </div>

      {/* ── VISÃO 1: RESUMO CONSOLIDADO POR CASAIS ──────────────────────────── */}
      {viewMode === 'couples' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
              <Heart className="w-5 h-5 text-tropical-coral" />
              Casais & Suítes Privativas
            </h2>
            <span className="text-xs text-tropical-text-muted font-medium">
              {couples.length} Casais &bull; Confirmação mútua para quartos duplos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {couples.map((couple) => {
              const badge = getCoupleBadge(couple.couple_status);

              return (
                <div key={couple.couple_id} className="tropical-card p-6 space-y-5 border-t-4 border-t-tropical-ocean">
                  
                  {/* Cabeçalho do Card do Casal */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-tropical-text-muted uppercase tracking-wider block">
                        {couple.label}
                      </span>
                      <h3 className="font-display font-extrabold text-lg text-tropical-text mt-0.5">
                        {couple.member_a_nickname || couple.member_a_name.split(' ')[0]} & {couple.member_b_nickname || couple.member_b_name.split(' ')[0]}
                      </h3>
                    </div>
                    <Badge variant={badge.variant} size="md" icon={badge.icon}>
                      {badge.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-tropical-text-secondary bg-tropical-sand-50/70 p-3 rounded-2xl border border-tropical-sand-border/40">
                    {badge.description}
                  </p>

                  {/* Detalhe dos Dois Membros */}
                  <div className="space-y-3 pt-1">
                    
                    {/* Membro A */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-tropical-sand-border/50 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={couple.member_a_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                          alt={couple.member_a_name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-tropical-sand-border"
                        />
                        <div>
                          <div className="text-sm font-bold text-tropical-text">
                            {couple.member_a_name}
                          </div>
                          <div className="text-[11px] text-tropical-text-muted">Parceiro A</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={couple.member_a_status === 'confirmed' ? 'palm' : couple.member_a_status === 'declined' ? 'danger' : 'sand'} 
                          size="sm"
                        >
                          {couple.member_a_status === 'confirmed' ? 'Confirmado' : couple.member_a_status === 'declined' ? 'Recusado' : 'Pendente'}
                        </Badge>
                        {(() => {
                          const memberRow = members.find(m => m.profile_id === couple.member_a_id);
                          if (!memberRow) return null;
                          return (
                            <button
                              onClick={() => handleToggleStatus(memberRow.id, memberRow.profile_id, memberRow.confirmation_status)}
                              className="text-[11px] text-tropical-ocean underline font-semibold hover:text-tropical-coral cursor-pointer"
                              title="Alternar status de presença"
                            >
                              Alternar
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Membro B */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-tropical-sand-border/50 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={couple.member_b_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'} 
                          alt={couple.member_b_name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-tropical-sand-border"
                        />
                        <div>
                          <div className="text-sm font-bold text-tropical-text">
                            {couple.member_b_name}
                          </div>
                          <div className="text-[11px] text-tropical-text-muted">Parceiro B</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={couple.member_b_status === 'confirmed' ? 'palm' : couple.member_b_status === 'declined' ? 'danger' : 'sand'} 
                          size="sm"
                        >
                          {couple.member_b_status === 'confirmed' ? 'Confirmado' : couple.member_b_status === 'declined' ? 'Recusado' : 'Pendente'}
                        </Badge>
                        {(() => {
                          const memberRow = members.find(m => m.profile_id === couple.member_b_id);
                          if (!memberRow) return null;
                          return (
                            <button
                              onClick={() => handleToggleStatus(memberRow.id, memberRow.profile_id, memberRow.confirmation_status)}
                              className="text-[11px] text-tropical-ocean underline font-semibold hover:text-tropical-coral cursor-pointer"
                              title="Alternar status de presença"
                            >
                              Alternar
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── VISÃO 2: LISTA INDIVIDUAL COMPLETA ──────────────────────────────── */}
      {viewMode === 'individual' && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
            <Users className="w-5 h-5 text-tropical-ocean" />
            Lista Individual de Convidados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map((member) => (
              <div key={member.id} className="tropical-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                      alt={member.profile.full_name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-tropical-sand-border"
                    />
                    <div>
                      <div className="font-bold text-sm text-tropical-text flex items-center gap-1.5">
                        {member.profile.full_name}
                        {member.role === 'admin' && (
                          <span title="Administradora da Viagem">
                            <Shield className="w-3.5 h-3.5 text-tropical-coral" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-tropical-text-muted">
                        {member.profile.nickname ? `"${member.profile.nickname}"` : member.role === 'admin' ? 'Organizadora' : 'Convidada'}
                      </div>
                    </div>
                  </div>

                  <Badge 
                    variant={member.confirmation_status === 'confirmed' ? 'palm' : member.confirmation_status === 'declined' ? 'danger' : 'sand'} 
                    size="sm"
                  >
                    {member.confirmation_status === 'confirmed' ? 'Confirmada' : member.confirmation_status === 'declined' ? 'Não vai' : 'Pendente'}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-tropical-sand-border/30 flex items-center justify-between">
                  <span className="text-xs text-tropical-text-muted flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {member.profile.phone || 'Sem WhatsApp'}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(member.id, member.profile_id, member.confirmation_status)}
                    className="text-xs font-bold text-tropical-ocean hover:text-tropical-coral transition-colors underline cursor-pointer"
                  >
                    {member.confirmation_status === 'confirmed' ? 'Marcar Pendente' : 'Confirmar Presença'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </PageShell>
  );
};
