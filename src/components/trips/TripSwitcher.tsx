import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, Map, CalendarDays, Settings2 } from 'lucide-react';
import { Trip } from '../../@types/database.types';
import { useTrip } from '../../contexts/TripContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formata uma data ISO (YYYY-MM-DD) no padrão "Mês Abreviado AAAA" em pt-BR.
 * Ex.: "2027-01-15" → "jan. 2027"
 */
function formatarMesAno(dataIso: string | null | undefined): string {
  if (!dataIso) return '';
  const [ano, mes] = dataIso.split('-').map(Number);
  if (!ano || !mes) return dataIso;

  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(ano, mes - 1, 1))
    .replace('.', '');
}

/**
 * Exibe o período da viagem formatado.
 * Ex.: "jan 2027 · mar 2027" ou só "jan 2027" se só houver uma data.
 */
function formatarPeriodo(trip: Trip): string {
  const inicio = formatarMesAno(trip.start_date);
  const fim = formatarMesAno(trip.end_date);

  if (inicio && fim && inicio !== fim) return `${inicio} · ${fim}`;
  if (inicio) return inicio;
  if (fim) return fim;
  return 'Sem data definida';
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const TripSwitcher: React.FC = () => {
  const { currentTrip, activeTrips, selectTrip } = useTrip();

  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!aberto) return;

    const handleClickFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  const handleSelecionarViagem = (tripId: string) => {
    selectTrip(tripId);
    setAberto(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      {/* Botão disparador */}
      <button
        onClick={() => setAberto((v) => !v)}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
          bg-tropical-sand-50 border border-tropical-sand-border/70
          hover:border-tropical-ocean/30 hover:bg-white
          transition-all duration-200 text-left group cursor-pointer
          ${aberto ? 'border-tropical-ocean/40 bg-white shadow-tropical-sm' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label="Selecionar viagem ativa"
      >
        {/* Ícone */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-tropical-ocean to-tropical-turquoise flex items-center justify-center shrink-0">
          <Map className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          {currentTrip ? (
            <>
              <p className="text-xs font-bold text-tropical-text truncate leading-tight">
                {currentTrip.title}
              </p>
              <p className="text-[10px] text-tropical-text-muted truncate flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-2.5 h-2.5 shrink-0" />
                {formatarPeriodo(currentTrip)}
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-tropical-text-muted truncate">
              Nenhuma viagem
            </p>
          )}
        </div>

        {/* Seta */}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-tropical-text-muted transition-transform duration-200 ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-tropical-sand-border/60 rounded-xl shadow-tropical-lg overflow-hidden animate-fade-in"
          role="listbox"
          aria-label="Lista de viagens"
        >
          {/* Lista de viagens (máx 5 visíveis) */}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {activeTrips.length === 0 ? (
              <p className="px-4 py-3 text-xs text-tropical-text-muted text-center">
                Nenhuma viagem ativa.
              </p>
            ) : (
              activeTrips.map((trip) => {
                const ativa = trip.id === currentTrip?.id;
                return (
                  <button
                    key={trip.id}
                    role="option"
                    aria-selected={ativa}
                    onClick={() => handleSelecionarViagem(trip.id)}
                    className={`
                      w-full flex items-start gap-2.5 px-4 py-2.5 text-left
                      transition-colors duration-150 cursor-pointer
                      ${
                        ativa
                          ? 'bg-tropical-ocean/5 text-tropical-ocean'
                          : 'text-tropical-text hover:bg-tropical-sand-50'
                      }
                    `}
                  >
                    {/* Indicador de seleção */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        ativa ? 'bg-tropical-ocean' : 'bg-tropical-sand-border'
                      }`}
                    />

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${ativa ? 'text-tropical-ocean' : 'text-tropical-text'}`}>
                        {trip.title}
                      </p>
                      <p className="text-[10px] text-tropical-text-muted truncate mt-0.5">
                        {formatarPeriodo(trip)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Divisor + link "Gerenciar Viagens" */}
          <div className="border-t border-tropical-sand-border/40">
            <NavLink
              to="/minhas-viagens"
              onClick={() => setAberto(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-tropical-ocean hover:bg-tropical-ocean/5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Gerenciar Viagens
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
};
