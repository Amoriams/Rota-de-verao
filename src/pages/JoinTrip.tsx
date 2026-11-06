import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Palmtree, 
  MapPin, 
  Calendar, 
  Heart, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Loader2,
  UserCheck,
  LogIn
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { memberService } from '../services/memberService';
import { Trip } from '../@types/database.types';
import { useTrip } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const JoinTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const navigate = useNavigate();
  const location = useLocation();
  const { selectTrip, refreshTrips } = useTrip();
  const { isAuthenticated, user, profile } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [errorTrip, setErrorTrip] = useState<string | null>(null);

  // Form State para Casal (opcional)
  const [isCouple, setIsCouple] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successJoin, setSuccessJoin] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        setErrorTrip('Link de convite inválido.');
        setIsLoadingTrip(false);
        return;
      }

      // Regra de Segurança: O UUID sozinho NUNCA concede acesso
      if (!token || token.trim().length < 8) {
        setErrorTrip(
          'Este link de convite é inválido ou incompleto. O acesso a viagens privadas exige o link oficial com o código de autorização gerado pela administradora.'
        );
        setIsLoadingTrip(false);
        return;
      }

      try {
        const found = await tripService.getTripById(tripId);
        if (!found) {
          setErrorTrip('Esta viagem não foi encontrada ou foi arquivada.');
        } else {
          setTrip(found);
        }
      } catch (err) {
        console.error('Erro ao buscar dados da viagem do convite:', err);
        setErrorTrip('Não foi possível carregar os detalhes desta viagem.');
      } finally {
        setIsLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [tripId, token]);

  const handleGoToAuth = () => {
    navigate('/entrar', { state: { from: location } });
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!tripId || !trip) {
      setFormError('Viagem inválida.');
      return;
    }

    if (!token || token.trim().length < 8) {
      setFormError('Código de convite ausente ou inválido.');
      return;
    }

    if (!user) {
      handleGoToAuth();
      return;
    }

    if (isCouple && (!partnerName.trim() || partnerName.trim().length < 2)) {
      setFormError('Informe o nome da pessoa que forma casal com você.');
      return;
    }

    setIsSubmitting(true);

    try {
      await memberService.acceptTripInvitation({
        tripId,
        token: token.trim(),
        isCouple,
        partnerName: isCouple ? partnerName.trim() : undefined,
        userProfile: {
          id: user.id,
          full_name: profile?.full_name || user.email?.split('@')[0] || 'Participante',
          avatar_url: profile?.avatar_url || null,
        },
      });

      // Seleciona a viagem no contexto global
      selectTrip(trip.id);
      await refreshTrips();

      setSuccessJoin(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao ingressar:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao aceitar convite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTrip) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-tropical-bg px-4">
        <div className="w-12 h-12 rounded-2xl bg-tropical-turquoise/15 text-tropical-ocean flex items-center justify-center animate-spin mb-3">
          <Palmtree className="w-6 h-6 text-tropical-ocean" />
        </div>
        <p className="text-sm font-semibold text-tropical-text-secondary">Carregando convite da praia... 🌊</p>
      </div>
    );
  }

  if (errorTrip || !trip) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-tropical-bg px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-tropical-coral-50 text-tropical-coral flex items-center justify-center mb-4 border border-tropical-coral-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-tropical-text mb-2">Convite Indisponível</h2>
        <p className="text-sm text-tropical-text-muted max-w-sm mb-6">{errorTrip}</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Voltar para o Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-tropical-bg px-4 py-12">
      {/* Background Decorativo */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xs"
        style={{ backgroundImage: `url('${trip.cover_image_url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tropical-sand-50/90 via-tropical-bg/95 to-tropical-bg" />

      {/* Card do Convite */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-tropical-lg border border-tropical-sand-border/60 overflow-hidden relative z-10 animate-slide-up">
        
        {/* Banner do Destino */}
        <div className="relative bg-gradient-to-br from-tropical-ocean-800 via-tropical-ocean to-tropical-turquoise p-8 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-tropical-sand-100 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-tropical-sand-200" />
            Você foi convidado(a) para viajar!
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight drop-shadow-sm">
            {trip.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-xs font-medium text-tropical-sand-100 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-tropical-coral" />
              {trip.destination}{trip.state ? `, ${trip.state}` : ''}
            </span>
            {trip.start_date && trip.end_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-tropical-sand-200" />
                {trip.start_date} a {trip.end_date}
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo do Convite */}
        <div className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-tropical-coral-50 border border-tropical-coral/30 text-tropical-coral text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successJoin && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-tropical-palm-50 border border-tropical-palm/30 text-tropical-palm text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-tropical-palm" />
              <span>Presença confirmada! Redirecionando para a viagem... 🌴</span>
            </div>
          )}

          {!isAuthenticated ? (
            /* ── ESTADO NÃO AUTENTICADO: DIRECIONA AO LOGIN / CADASTRO ── */
            <div className="text-center space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-tropical-sand-50 border border-tropical-sand-border/60 text-xs text-tropical-text-secondary leading-relaxed">
                Esta é uma viagem privada. Para confirmar sua presença e ter acesso aos votos, passagens e hospedagem, acesse sua conta ou crie um cadastro gratuito.
              </div>

              <Button
                onClick={handleGoToAuth}
                variant="coral"
                size="lg"
                fullWidth
                icon={<LogIn className="w-4 h-4" />}
                className="py-3 shadow-tropical"
              >
                Fazer login ou criar conta para entrar
              </Button>
            </div>
          ) : (
            /* ── ESTADO AUTENTICADO: ENTRADA DIRETA SEM PIN ── */
            <form onSubmit={handleAcceptInvite} className="space-y-5">
              {/* Identificação da Conta */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-tropical-sand-50 border border-tropical-sand-border/60 text-xs">
                <div className="w-10 h-10 rounded-full bg-tropical-ocean text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {profile?.full_name?.slice(0, 1).toUpperCase() || user?.email?.slice(0, 1).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-tropical-text-muted block">
                    Entrando como:
                  </span>
                  <p className="font-bold text-sm text-tropical-text truncate">
                    {profile?.full_name || user?.email}
                  </p>
                  <span className="text-[11px] text-tropical-palm font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Conta autenticada
                  </span>
                </div>
              </div>

              {/* Opção de Casal (Opcional) */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-tropical-sand-border/70 hover:bg-tropical-sand-50/50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox"
                    checked={isCouple}
                    onChange={(e) => setIsCouple(e.target.checked)}
                    className="w-4 h-4 rounded text-tropical-ocean focus:ring-tropical-ocean cursor-pointer"
                  />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-tropical-text flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-tropical-coral" />
                      Vou participar como casal
                    </span>
                    <span className="block text-xs text-tropical-text-muted mt-0.5">
                      Facilita a reserva de quartos privativos e assentos.
                    </span>
                  </div>
                </label>

                {isCouple && (
                  <div className="mt-2 pl-7 animate-fade-in">
                    <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                      Nome do(a) Parceiro(a) *
                    </label>
                    <input 
                      type="text"
                      required={isCouple}
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Ex.: Gabriel Ramos"
                      className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean transition-all"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="coral"
                fullWidth
                disabled={isSubmitting || successJoin}
                icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="py-3 shadow-tropical"
              >
                {isSubmitting ? 'Confirmando entrada...' : 'Confirmar Presença & Entrar na Viagem'}
              </Button>

              <p className="text-center text-[11px] text-tropical-text-muted">
                Sem exigência de PIN &bull; Acesso imediato à programação da viagem
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
