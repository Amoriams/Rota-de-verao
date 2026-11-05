import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Palmtree, 
  MapPin, 
  Calendar, 
  Heart, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { tripService } from '../services/tripService';
import { memberService } from '../services/memberService';
import { Trip } from '../@types/database.types';
import { useTrip } from '../contexts/TripContext';
import { Button } from '../components/common/Button';

export const JoinTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { selectTrip, refreshTrips } = useTrip();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [errorTrip, setErrorTrip] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
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
  }, [tripId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!tripId || !trip) {
      setFormError('Viagem inválida.');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Por favor, informe seu nome completo.');
      return;
    }

    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setFormError('Crie um código PIN de exatamente 6 dígitos numéricos.');
      return;
    }

    if (isCouple && (!partnerName.trim() || partnerName.trim().length < 2)) {
      setFormError('Informe o nome da pessoa que forma casal com você.');
      return;
    }

    setIsSubmitting(true);

    try {
      await memberService.joinTripByLink({
        tripId,
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        pin: cleanPin,
        isCouple,
        partnerName: isCouple ? partnerName.trim() : undefined,
      });

      // Seleciona a viagem no contexto global
      selectTrip(trip.id);
      await refreshTrips();

      setSuccessJoin(true);
      setTimeout(() => {
        navigate('/participantes');
      }, 1800);
    } catch (err: unknown) {
      console.error('Erro ao ingressar:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao concluir entrada na viagem.');
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

        {/* Formulário de Ingresso */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {formError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-tropical-coral-50 border border-tropical-coral/30 text-tropical-coral text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successJoin && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-tropical-palm-50 border border-tropical-palm/30 text-tropical-palm text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-tropical-palm" />
              <span>Bem-vindo(a) à viagem! Redirecionando para o grupo... 🌴</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                Seu Nome Completo *
              </label>
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex.: Carolina Mendes"
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                  Como quer ser chamado(a)? (Apelido)
                </label>
                <input 
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex.: Carol"
                  className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                  WhatsApp (DDD + Número)
                </label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border text-sm text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean transition-all"
                />
              </div>
            </div>

            {/* Criação do PIN de Acesso */}
            <div className="p-4 rounded-2xl bg-tropical-sand-50/70 border border-tropical-sand-border/70 space-y-2">
              <label className="block text-xs font-bold text-tropical-ocean uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Crie seu PIN de 6 dígitos *
              </label>
              <p className="text-[11px] text-tropical-text-muted">
                Este código será sua chave individual para acessar o planejamento desta viagem em qualquer dispositivo.
              </p>
              <input 
                type="password"
                required
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex.: 123456"
                className="w-full px-4 py-2.5 rounded-xl border border-tropical-sand-border bg-white text-center font-mono text-lg tracking-widest text-tropical-text focus:outline-none focus:ring-2 focus:ring-tropical-ocean/30 focus:border-tropical-ocean transition-all"
              />
            </div>

            {/* Seleção de Casal */}
            <div className="pt-2">
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
                    Facilita a organização de quartos duplos e translados.
                  </span>
                </div>
              </label>

              {isCouple && (
                <div className="mt-3 pl-7 animate-fade-in">
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
                  <span className="block text-[11px] text-tropical-text-muted mt-1">
                    Ele(a) entrará como pendente até confirmar sua própria presença.
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting || successJoin}
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            iconPosition="right"
            className="py-3 mt-4"
          >
            {isSubmitting ? 'Confirmando entrada...' : 'Entrar na Viagem & Ver Grupo'}
          </Button>

          <p className="text-center text-[11px] text-tropical-text-muted pt-2">
            Ao ingressar, você terá acesso imediato à lista de participantes, opções de hospedagem e enquetes.
          </p>
        </form>

      </div>
    </div>
  );
};
