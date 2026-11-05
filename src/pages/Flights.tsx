import React, { useState } from 'react';
import { 
  Plane, 
  Luggage, 
  Clock, 
  ExternalLink, 
  TrendingDown, 
  Calendar
} from 'lucide-react';
import { MOCK_FLIGHTS } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';

export const Flights: React.FC = () => {
  const [flightType, setFlightType] = useState<'todos' | 'ida' | 'volta'>('todos');

  const filteredFlights = flightType === 'todos' 
    ? MOCK_FLIGHTS 
    : MOCK_FLIGHTS.filter(f => f.type === flightType);

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA COM FILTROS ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Plane className="w-3.5 h-3.5 text-tropical-ocean" />
              Malha Aérea Sugerida
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Passagens & Voos em Grupo
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Trajetos recomendados São Paulo (GRU) &harr; Fortaleza (FOR) pesquisados para nossa turma.
          </p>
        </div>

        {/* Filtro de Tipo em Pills */}
        <div className="inline-flex p-1 rounded-2xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm self-start md:self-auto">
          <button
            onClick={() => setFlightType('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              flightType === 'todos'
                ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                : 'text-tropical-text-secondary hover:text-tropical-ocean'
            }`}
          >
            Todos ({MOCK_FLIGHTS.length})
          </button>
          <button
            onClick={() => setFlightType('ida')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              flightType === 'ida'
                ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                : 'text-tropical-text-secondary hover:text-tropical-ocean'
            }`}
          >
            Apenas Ida
          </button>
          <button
            onClick={() => setFlightType('volta')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              flightType === 'volta'
                ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                : 'text-tropical-text-secondary hover:text-tropical-ocean'
            }`}
          >
            Apenas Volta
          </button>
        </div>
      </div>

      {/* Alerta de Transparência de Compra */}
      <aside aria-label="Informações sobre compra e monitoramento de passagens" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-turquoise-50 text-tropical-ocean flex items-center justify-center shrink-0 shadow-xs">
          <TrendingDown className="w-5 h-5 text-tropical-ocean" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Compra individual e direta pelo viajante
          </p>
          <p className="text-tropical-text-muted">
            Cada participante adquire seu bilhete diretamente com a companhia aérea para aproveitar milhas e assentos de sua preferência.
            Os links abaixo redirecionam diretamente para as rotas pesquisadas nos portais oficiais da GOL e LATAM.
          </p>
        </div>
      </aside>

      {/* Lista de Voos com Linha do Tempo Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFlights.map((flight) => (
          <div key={flight.id} className="tropical-card p-6 space-y-5 border-l-4 border-l-tropical-ocean flex flex-col justify-between">
            
            <div className="space-y-4">
              {/* Topo do Voo */}
              <div className="flex items-center justify-between border-b border-tropical-sand-border/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-tropical-sand-100 text-tropical-text flex items-center justify-center font-bold text-xs shadow-xs">
                    {flight.airline.includes('GOL') ? 'G3' : 'LA'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-tropical-text">
                      {flight.airline}
                    </h3>
                    <span className="text-[11px] text-tropical-text-muted font-mono">
                      Voo {flight.flightNumber}
                    </span>
                  </div>
                </div>

                <Badge variant={flight.type === 'ida' ? 'ocean' : 'coral'} size="sm">
                  {flight.type === 'ida' ? 'Trecho de Ida' : 'Trecho de Volta'}
                </Badge>
              </div>

              {/* Trajeto e Horários em Timeline Editorial */}
              <div className="flex items-center justify-between py-2">
                {/* Origem */}
                <div className="text-left">
                  <div className="text-3xl font-extrabold font-display text-tropical-ocean tracking-tight">
                    {flight.originAirport}
                  </div>
                  <div className="text-xs text-tropical-text-muted">{flight.originCity}</div>
                  <div className="text-xs font-bold text-tropical-text mt-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />
                    {flight.departureTime.split(' ')[1]}
                  </div>
                </div>

                {/* Ícone de Rota */}
                <div className="flex-1 px-4 flex flex-col items-center">
                  <span className="text-[10px] text-tropical-text-muted font-semibold tracking-wide">3h 35m voo direto</span>
                  <div className="w-full flex items-center gap-1 my-1.5">
                    <div className="h-0.5 flex-1 bg-tropical-sand-border/80" />
                    <Plane className="w-4 h-4 text-tropical-turquoise rotate-90" />
                    <div className="h-0.5 flex-1 bg-tropical-sand-border/80" />
                  </div>
                  <span className="text-[10px] text-tropical-palm font-bold uppercase tracking-wider">Sem escalas</span>
                </div>

                {/* Destino */}
                <div className="text-right">
                  <div className="text-3xl font-extrabold font-display text-tropical-ocean tracking-tight">
                    {flight.destinationAirport}
                  </div>
                  <div className="text-xs text-tropical-text-muted">{flight.destinationCity}</div>
                  <div className="text-xs font-bold text-tropical-text mt-1.5 flex items-center justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-tropical-text-muted" />
                    {flight.arrivalTime.split(' ')[1]}
                  </div>
                </div>
              </div>

              {/* Informações de Bagagem e Data */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-tropical-sand-border/30 text-xs">
                <div className="flex items-center gap-1.5 text-tropical-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-tropical-ocean" />
                  <span>Data: <strong>{flight.departureTime.split(' ')[0]}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-tropical-text-muted" />
                  {flight.baggageIncluded ? (
                    <span className="text-tropical-palm font-bold">Mala despachada inclusa (23kg)</span>
                  ) : (
                    <span className="text-tropical-coral font-bold">Mala de mão inclusa (10kg)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Preço e Botão de Compra Externa */}
            <div className="pt-4 border-t border-tropical-sand-border/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-tropical-text-muted uppercase block font-bold">
                  Tarifa estimada
                </span>
                <span className="text-2xl font-extrabold font-display text-tropical-text">
                  R$ {flight.price.toFixed(2)}
                </span>
              </div>

              <a
                href={flight.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="coral" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Ver no Site da {flight.airline.split(' ')[0]}
                </Button>
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* Caixa de Monitoramento de Preço-Alvo */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-tropical-coral uppercase tracking-wider block">
              Recurso Planejado &bull; Marco 8
            </span>
            <h3 className="font-display font-bold text-lg text-tropical-text">
              Monitoramento Inteligente de Preço-Alvo
            </h3>
          </div>
          <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean font-bold">
            Meta: R$ 900,00
          </span>
        </div>

        <p className="text-xs md:text-sm text-tropical-text-secondary leading-relaxed max-w-3xl">
          Nossa arquitetura isola o monitoramento de voos. A administradora define rotas e tetos de preço recomendados para o grupo. Assim que houver tarifas promocionais nos voos da turma, o painel destaca o momento ideal para todos emitirem os bilhetes juntos.
        </p>
      </div>

    </PageShell>
  );
};
