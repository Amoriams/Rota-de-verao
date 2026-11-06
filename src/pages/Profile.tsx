import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  Edit3, 
  Save, 
  LogOut, 
  Sparkles, 
  Palmtree, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { memberService } from '../services/memberService';
import { TripMemberWithProfile, CoupleStatusView, ConfirmationStatus } from '../@types/database.types';
import { PageShell } from '../components/layout/PageShell';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const Profile: React.FC = () => {
  const { user, profile, role, logout, updateProfile } = useAuth();
  const { currentTrip } = useTrip();

  // Dados do participante
  const [currentMember, setCurrentMember] = useState<TripMemberWithProfile | null>(null);
  const [coupleInfo, setCoupleInfo] = useState<CoupleStatusView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modo edição
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Carrega informações do membro e casal
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const tripId = currentTrip?.id;
        if (tripId) {
          const [allMembers, allCouples] = await Promise.all([
            memberService.getMembers(tripId),
            memberService.getCouplesStatus(tripId),
          ]);

          // Identifica o membro atual
          const myProfileId = profile?.id || user?.id;
          const foundMember = allMembers.find(m => m.profile_id === myProfileId || m.profile.full_name === profile?.full_name);
          
          if (foundMember) {
            setCurrentMember(foundMember);
            setFullName(foundMember.profile.full_name);
            setNickname(foundMember.profile.nickname || '');
            setPhone(foundMember.profile.phone || '');
            setAvatarUrl(foundMember.profile.avatar_url || '');

            // Procura casal correspondente
            if (foundMember.couple_id) {
              const foundCouple = allCouples.find(c => c.couple_id === foundMember.couple_id);
              if (foundCouple) setCoupleInfo(foundCouple);
            }
          } else if (profile) {
            setFullName(profile.full_name);
            setNickname(profile.nickname || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url || '');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [currentTrip?.id, profile, user?.id]);

  // Salvar alterações no perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'O nome completo é obrigatório.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      if (currentMember) {
        setCurrentMember({
          ...currentMember,
          profile: {
            ...currentMember.profile,
            full_name: fullName.trim(),
            nickname: nickname.trim() || null,
            phone: phone.trim() || null,
            avatar_url: avatarUrl.trim() || null,
          }
        });
      }

      setFeedback({ type: 'success', message: 'Informações atualizadas com sucesso!' });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao atualizar perfil:', err);
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao salvar alterações.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Alterar presença individual
  const handleToggleStatus = async () => {
    if (!currentMember) return;
    const nextStatus: ConfirmationStatus = currentMember.confirmation_status === 'confirmed' ? 'pending' : 'confirmed';

    try {
      await memberService.updateConfirmationStatus(currentMember.id, nextStatus);
      setCurrentMember({
        ...currentMember,
        confirmation_status: nextStatus,
        confirmed_at: nextStatus === 'confirmed' ? new Date().toISOString() : null,
      });

      if (currentTrip?.id) {
        const updatedCouples = await memberService.getCouplesStatus(currentTrip.id);
        const couple = updatedCouples.find(c => c.couple_id === currentMember.couple_id);
        if (couple) setCoupleInfo(couple);
      }

      setFeedback({
        type: 'success',
        message: nextStatus === 'confirmed' ? 'Sua presença foi confirmada!' : 'Presença marcada como pendente.',
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const getStatusBadge = (status: ConfirmationStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Presença Confirmada',
          variant: 'palm' as const,
          icon: <CheckCircle2 className="w-4 h-4 text-tropical-palm" />,
        };
      case 'declined':
        return {
          label: 'Não Comparecerá',
          variant: 'danger' as const,
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
        };
      default:
        return {
          label: 'Confirmação Pendente',
          variant: 'sand' as const,
          icon: <Clock className="w-4 h-4 text-tropical-text-muted" />,
        };
    }
  };

  const activeStatus = currentMember?.confirmation_status || 'confirmed';
  const badgeInfo = getStatusBadge(activeStatus);

  if (isLoading) {
    return (
      <PageShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-tropical-bg">
          <div className="w-12 h-12 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center animate-pulse mb-3">
            <Loader2 className="w-6 h-6 animate-spin text-tropical-ocean" />
          </div>
          <p className="font-display font-medium text-sm text-tropical-text-secondary">
            Carregando suas informações de perfil... 🌊
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DO PERFIL ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <User className="w-3.5 h-3.5 text-tropical-ocean" />
              Área Pessoal
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Meu Perfil
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Gerencie suas informações, confirmação na viagem e preferências.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-tropical-sand-border/70 hover:border-tropical-coral/40 text-tropical-text-secondary hover:text-tropical-coral text-xs md:text-sm font-bold shadow-tropical-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 text-tropical-coral" />
          Sair da Conta
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs md:text-sm font-semibold flex items-center gap-2 shadow-tropical-sm animate-slide-up ${
          feedback.type === 'success'
            ? 'bg-tropical-palm-50 border border-tropical-palm-200 text-tropical-palm-600'
            : 'bg-tropical-coral-50 border border-tropical-coral-200 text-tropical-coral-600'
        }`}>
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── CARD PRINCIPAL DE IDENTIFICAÇÃO DO PARTICIPANTE ─────────────────── */}
      <div className="bg-white rounded-3xl border border-tropical-sand-border/60 shadow-tropical-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          
          {/* Avatar com Badge de Role */}
          <div className="relative group shrink-0">
            <img 
              src={avatarUrl || profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || 'User')}`} 
              alt={fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-tropical-sand-100 shadow-tropical-sm group-hover:scale-105 transition-transform" 
            />
            {role === 'admin' ? (
              <span className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-tropical-coral text-white shadow-tropical-sm" title="Organizadora da Viagem">
                <ShieldCheck className="w-4 h-4" />
              </span>
            ) : (
              <span className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-tropical-ocean text-white shadow-tropical-sm" title="Participante Confirmado">
                <Sparkles className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Informações Centrais */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-tropical-text truncate">
                  {fullName || profile?.full_name || 'Participante'}
                </h2>
                {nickname && (
                  <p className="text-xs font-semibold text-tropical-text-muted">
                    Conhecido(a) como "{nickname}"
                  </p>
                )}
              </div>

              {!isEditing && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  className="self-center sm:self-auto"
                >
                  Editar Perfil
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-tropical-text-secondary">
              {phone && (
                <span className="flex items-center gap-1.5 bg-tropical-sand-50 px-3 py-1.5 rounded-xl border border-tropical-sand-border/50">
                  <Phone className="w-3.5 h-3.5 text-tropical-turquoise" />
                  {phone}
                </span>
              )}
              {currentTrip && (
                <span className="flex items-center gap-1.5 bg-tropical-turquoise/10 text-tropical-ocean px-3 py-1.5 rounded-xl border border-tropical-turquoise/30 font-semibold">
                  <Palmtree className="w-3.5 h-3.5" />
                  Viagem: {currentTrip.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── FORMULÁRIO DE EDIÇÃO RÁPIDA ─────────────────────────────────── */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-8 pt-6 border-t border-tropical-sand-border/40 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-tropical-ocean uppercase tracking-wider mb-2">
              Editar Dados Pessoais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tropical-text mb-1">
                  Nome Completo *
                </label>
                <input 
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tropical-text mb-1">
                  Apelido / Como prefere ser chamado(a)
                </label>
                <input 
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tropical-text mb-1">
                  WhatsApp (DDD + Número)
                </label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tropical-text mb-1">
                  URL da Foto de Perfil (Opcional)
                </label>
                <input 
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="w-full px-3.5 py-2 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                disabled={isSaving}
                icon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── GRID DE STATUS E RESUMO DA VIAGEM ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Presença na Viagem */}
        <div className="bg-white rounded-3xl border border-tropical-sand-border/60 shadow-tropical-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">
              Status de Presença
            </span>
            <Badge variant={badgeInfo.variant} size="sm">
              <span className="flex items-center gap-1.5">
                {badgeInfo.icon}
                {badgeInfo.label}
              </span>
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-tropical-text">
              {activeStatus === 'confirmed' 
                ? 'Sua presença está confirmada nesta viagem!' 
                : 'Você ainda não confirmou sua presença.'}
            </p>
            <p className="text-xs text-tropical-text-muted">
              Você pode alterar sua confirmação a qualquer momento para ajudar a organizadora no fechamento de quartos e veículos.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleToggleStatus}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                activeStatus === 'confirmed'
                  ? 'bg-tropical-sand-100 hover:bg-tropical-sand-200 text-tropical-text-secondary'
                  : 'bg-tropical-ocean hover:bg-tropical-ocean-600 text-white'
              }`}
            >
              {activeStatus === 'confirmed' ? 'Desmarcar Presença' : 'Confirmar Presença Agora'}
            </button>
          </div>
        </div>

        {/* Card 2: Participação em Casal */}
        <div className="bg-white rounded-3xl border border-tropical-sand-border/60 shadow-tropical-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider">
              Casal & Quarto Privativo
            </span>
            <span className="p-1.5 rounded-xl bg-tropical-coral-50 text-tropical-coral">
              <Heart className="w-4 h-4" />
            </span>
          </div>

          {coupleInfo ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-tropical-sand-50/70 border border-tropical-sand-border/60">
                <p className="text-xs font-bold text-tropical-text">{coupleInfo.label}</p>
                <p className="text-[11px] text-tropical-text-muted mt-0.5">
                  Parceiro(a): <strong className="text-tropical-text">{coupleInfo.member_b_name}</strong>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-tropical-text-secondary">Status do Casal:</span>
                  <Badge 
                    variant={coupleInfo.couple_status === 'confirmed' ? 'palm' : coupleInfo.couple_status === 'partial' ? 'sand' : 'danger'} 
                    size="sm"
                  >
                    {coupleInfo.couple_status === 'confirmed' ? 'Ambos Confirmados' : coupleInfo.couple_status === 'partial' ? '1 de 2 Confirmados' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-tropical-text-muted">
                Quarto de casal garantido no planejamento de hospedagem da turma.
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              <p className="text-sm font-semibold text-tropical-text">
                Participação Individual
              </p>
              <p className="text-xs text-tropical-text-muted">
                Você está cadastrado(a) individualmente para quartos coletivos ou acomodações compartilhadas da turma.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── CARD RESUMO DA VIAGEM SELECIONADA ─────────────────────────────── */}
      {currentTrip && (
        <div className="bg-gradient-to-br from-tropical-ocean-800 to-tropical-ocean text-white rounded-3xl p-6 sm:p-8 shadow-tropical-lg relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-tropical-sand-200 text-xs font-semibold">
              <Palmtree className="w-3.5 h-3.5" />
              Sua Viagem Atual
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-2xl text-white">
                {currentTrip.title}
              </h3>
              <p className="text-tropical-sand-100 text-sm flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
                  {currentTrip.destination}{currentTrip.state ? `, ${currentTrip.state}` : ''}
                </span>
                {currentTrip.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-tropical-turquoise" />
                    {currentTrip.start_date} a {currentTrip.end_date}
                  </span>
                )}
              </p>
            </div>

            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {currentTrip.description || 'Acompanhe as passagens sugeridas, opções de hospedagem para votação e as enquetes da nossa turma.'}
            </p>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
            <Palmtree className="w-64 h-64 text-white" />
          </div>
        </div>
      )}

    </PageShell>
  );
};
