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
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const Flights: React.FC = () => {
  const [flightType, setFlightType] = useState<'todos' | 'ida' | 'volta'>('todos');

  const filteredFlights = flightType === 'todos' 
    ? MOCK_FLIGHTS 
    : MOCK_FLIGHTS.filter(f => f.type === flightType);

  return (
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Passagens & Voos Sugeridos
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Opções de trajetos aéreos pesquisadas pela organizadora para o trajeto São Paulo (GRU) &harr; Fortaleza (FOR).
          </p>
        </div>

        {/* Filtro de Tipo */}
        <div className="inline-flex p-1 rounded-2xl bg-coastal-sand-light/80 border border-coastal-sand-border self-start md:self-auto">
          <button
            onClick={() => setFlightType('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              flightType === 'todos'
                ? 'bg-coastal-ocean text-white shadow-coastal'
                : 'text-coastal-ocean-700 hover:text-coastal-ocean'
            }`}
          >
            Todos ({MOCK_FLIGHTS.length})
          </button>
          <button
            onClick={() => setFlightType('ida')}
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              flightType === 'ida'
                ? 'bg-coastal-ocean text-white shadow-coastal'
                : 'text-coastal-ocean-700 hover:text-coastal-ocean'
            }`}
          >
            Apenas Ida
          </button>
          <button
            onClick={() => setFlightType('volta')}
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              flightType === 'volta'
                ? 'bg-coastal-ocean text-white shadow-coastal'
                : 'text-coastal-ocean-700 hover:text-coastal-ocean'
            }`}
          >
            Apenas Volta
          </button>
        </div>
      </div>

      {/* Alerta de Transparência de Compra */}
      <aside aria-label="Informações sobre compra e monitoramento de passagens" className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
        <TrendingDown className="w-5 h-5 text-coastal-water-dark shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-cyan-900 leading-relaxed">
          <strong>Atenção sobre emissão de passagens:</strong> As passagens aéreas são de contratação individual e direta pelo viajante. Os links abaixo redirecionam diretamente para os sites oficiais das companhias aéreas (GOL e LATAM) com as tarifas encontradas no momento da pesquisa.
        </div>
      </aside>

      {/* Lista de Voos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFlights.map((flight) => (
          <Card key={flight.id} padding="md" className="space-y-4 border-l-4 border-l-coastal-ocean">
            
            {/* Topo do Voo */}
            <div className="flex items-center justify-between border-b border-coastal-sand/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-coastal-ocean-50 text-coastal-ocean flex items-center justify-center font-bold text-xs">
                  {flight.airline.includes('GOL') ? 'G3' : 'LA'}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-coastal-ocean">
                    {flight.airline}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Voo {flight.flightNumber}
                  </span>
                </div>
              </div>

              <Badge variant={flight.type === 'ida' ? 'ocean' : 'coral'} size="sm">
                {flight.type === 'ida' ? 'Trecho de Ida' : 'Trecho de Volta'}
              </Badge>
            </div>

            {/* Trajeto e Horários */}
            <div className="flex items-center justify-between py-2">
              {/* Origem */}
              <div className="text-left">
                <div className="text-2xl font-bold font-display text-coastal-ocean">
                  {flight.originAirport}
                </div>
                <div className="text-xs text-slate-500">{flight.originCity}</div>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {flight.departureTime.split(' ')[1]}
                </div>
              </div>

              {/* Ícone de Rota */}
              <div className="flex-1 px-4 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-medium">3h 30m voo direto</span>
                <div className="w-full flex items-center gap-1 my-1">
                  <div className="h-0.5 flex-1 bg-coastal-sand-border" />
                  <Plane className="w-4 h-4 text-coastal-water-dark rotate-90" />
                  <div className="h-0.5 flex-1 bg-coastal-sand-border" />
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Sem escalas</span>
              </div>

              {/* Destino */}
              <div className="text-right">
                <div className="text-2xl font-bold font-display text-coastal-ocean">
                  {flight.destinationAirport}
                </div>
                <div className="text-xs text-slate-500">{flight.destinationCity}</div>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {flight.arrivalTime.split(' ')[1]}
                </div>
              </div>
            </div>

            {/* Informações de Bagagem e Data */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-coastal-sand/40 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-coastal-ocean" />
                <span>Data: {flight.departureTime.split(' ')[0]}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Luggage className="w-3.5 h-3.5 text-slate-500" />
                {flight.baggageIncluded ? (
                  <span className="text-emerald-700 font-medium">Mala despachada inclusa (23kg)</span>
                ) : (
                  <span className="text-amber-800 font-medium">Apenas mala de mão (10kg)</span>
                )}
              </div>
            </div>

            {/* Preço e Botão de Compra Externa */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                  Tarifa por pessoa
                </span>
                <span className="text-2xl font-bold font-display text-coastal-ocean">
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

          </Card>
        ))}
      </div>

      {/* Caixa de Monitoramento de Preço-Alvo (Conforme Requisito 7) */}
      <div className="p-6 rounded-3xl bg-white border border-coastal-sand/60 shadow-coastal space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-coastal-coral uppercase tracking-wider">
              Recurso Planejado (Marco 8)
            </span>
            <h3 className="font-display font-bold text-lg text-coastal-ocean">
              Monitoramento Inteligente de Preço-Alvo
            </h3>
          </div>
          <Badge variant="water" size="sm">
            Teto: R$ 900,00
          </Badge>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Nossa arquitetura isola o monitoramento via padrão <em>Adapter</em>. A administradora define rotas e preços máximos desejados (ex: R$ 900,00 para São Paulo &rarr; Fortaleza). Quando alguém do grupo encontrar uma promoção ou houver tarifa oficial vantajosa, o sistema gera alerta imediato para todos comprarem no melhor momento!
        </p>
      </div>

    </div>
  );
};
