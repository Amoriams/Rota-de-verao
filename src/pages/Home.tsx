import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Vote, 
  Receipt 
} from 'lucide-react';
import { MOCK_TRIP, MOCK_PARTICIPANTS } from '../data/mockData';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const Home: React.FC = () => {
  const confirmedCount = MOCK_PARTICIPANTS.filter(p => p.status === 'confirmed').length;

  return (
    <div className="space-y-12 md:space-y-16">
      
      {/* Hero Section com Imagem Impactante */}
      <section className="relative rounded-3xl overflow-hidden shadow-coastal border border-coastal-sand/60">
        <div className="absolute inset-0 bg-gradient-to-t from-coastal-ocean-900/90 via-coastal-ocean-800/40 to-black/20 z-10" />
        <img
          src={MOCK_TRIP.coverImageUrl}
          alt={MOCK_TRIP.title}
          className="w-full h-[420px] md:h-[500px] object-cover object-center"
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 text-white">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="water" size="md" className="font-semibold shadow-sm">
                Viagem Confirmada 🏖️
              </Badge>
              <span className="text-coastal-sand-light text-xs md:text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4 text-coastal-water" /> {MOCK_TRIP.startDate} até {MOCK_TRIP.endDate}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              {MOCK_TRIP.title}
            </h1>

            <div className="flex items-center gap-2 text-coastal-water-light text-lg md:text-xl font-medium">
              <MapPin className="w-5 h-5 text-coastal-coral shrink-0" />
              <span>{MOCK_TRIP.destination} &bull; {MOCK_TRIP.state}</span>
            </div>

            <p className="text-coastal-sand-light/90 text-sm md:text-base leading-relaxed max-w-2xl">
              {MOCK_TRIP.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/dashboard">
                <Button size="lg" variant="coral" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                  Acessar Dashboard
                </Button>
              </Link>
              <Link to="/participantes">
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  Ver Participantes ({confirmedCount} Confirmados)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques Rápidos da Viagem */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card padding="md" className="border-t-4 border-t-coastal-ocean">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coastal-ocean-50 text-coastal-ocean flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-coastal-ocean font-display">
                {confirmedCount} <span className="text-sm font-normal text-slate-500">/ {MOCK_PARTICIPANTS.length}</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">Presenças Confirmadas</div>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-t-4 border-t-coastal-coral">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-coastal-coral flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-coastal-ocean font-display">
                7 <span className="text-sm font-normal text-slate-500">dias</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">De Praia e Descanso</div>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-t-4 border-t-coastal-water">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-coastal-water-dark flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-coastal-ocean font-display">
                2 <span className="text-sm font-normal text-slate-500">abertas</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">Votações Ativas</div>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-t-4 border-t-coastal-sand-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coastal-sand-light text-coastal-sand-dark flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-coastal-ocean font-display">
                R$ 2.850
              </div>
              <div className="text-xs text-slate-600 font-medium">Estimativa Média / Pessoa</div>
            </div>
          </div>
        </Card>
      </section>

      {/* Por que o Rota de Verão? Diferenciais da Plataforma */}
      <section className="bg-white rounded-3xl p-6 md:p-10 border border-coastal-sand/60 shadow-coastal">
        <div className="max-w-2xl mb-8">
          <Badge variant="ocean" size="sm" className="mb-2">
            Organização sem Estresse
          </Badge>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Como funciona a nossa viagem?
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-2">
            Chega de mensagens perdidas no WhatsApp, enquetes confusas e dúvidas sobre quanto cada um deve pagar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-coastal-offwhite border border-coastal-sand/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-coastal-water-light text-coastal-ocean flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-coastal-ocean">
              Visão Especial de Casais
            </h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Cada pessoa confirma sua própria presença, mas a organizadora e os amigos acompanham facilmente o status conjunto de cada casal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-coastal-offwhite border border-coastal-sand/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-coastal-coral-dark flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-coastal-ocean">
              Decisões Democráticas
            </h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Votações oficiais para escolha da melhor casa, passeios e restaurantes com apuração transparente em tempo real.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-coastal-offwhite border border-coastal-sand/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-coastal-ocean">
              Divisão de Custos Justa
            </h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Carros são divididos apenas entre quem vai andar no carro. Despesas coletivas incluem apenas quem confirmou presença. Sem surpresas na volta!
            </p>
          </div>
        </div>
      </section>

      {/* Chamada para o Convidado */}
      <section className="bg-gradient-to-r from-coastal-ocean via-coastal-ocean-600 to-coastal-ocean-700 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-coastal">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="font-display font-bold text-2xl md:text-3xl text-white">
            Você é um dos convidados da viagem?
          </h3>
          <p className="text-coastal-sand-light text-sm md:text-base max-w-xl">
            Acesse o painel para conferir as opções de casas, voos recomendados e registrar seus votos para definirmos a programação.
          </p>
        </div>
        <Link to="/dashboard" className="shrink-0">
          <Button size="lg" variant="coral">
            Abrir Painel da Viagem
          </Button>
        </Link>
      </section>

    </div>
  );
};
