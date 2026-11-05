import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  HelpCircle,
  Check,
  Vote,
  CheckCircle2
} from 'lucide-react';
import { MOCK_POLLS } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Poll } from '../types';
import { PageShell } from '../components/layout/PageShell';

interface PollsProps {
  currentRole: 'admin' | 'member';
}

export const Polls: React.FC<PollsProps> = ({ currentRole }) => {
  const [pollsList, setPollsList] = useState<Poll[]>(MOCK_POLLS);

  // Registro de voto interativo
  const handleVote = (pollId: string, optionId: string) => {
    setPollsList(prev => prev.map(poll => {
      if (poll.id !== pollId) return poll;
      if (poll.isClosed) return poll;

      // Recalcula votos das opções
      const prevOptionId = poll.userVotedOptionId;
      const isNewVote = !prevOptionId;

      const updatedOptions = poll.options.map(opt => {
        let count = opt.voteCount;
        if (opt.id === optionId) count += 1;
        if (opt.id === prevOptionId && !isNewVote) count = Math.max(0, count - 1);
        return { ...opt, voteCount: count };
      });

      const total = updatedOptions.reduce((acc, curr) => acc + curr.voteCount, 0);
      const withPercentages = updatedOptions.map(opt => ({
        ...opt,
        percentage: total > 0 ? Math.round((opt.voteCount / total) * 100) : 0,
      }));

      return {
        ...poll,
        options: withPercentages,
        totalVotes: total,
        userVotedOptionId: optionId,
      };
    }));
  };

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Vote className="w-3.5 h-3.5 text-tropical-ocean" />
              Decisões Coletivas
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Votações & Enquetes da Viagem
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Decisões democráticas com apuração em tempo real e prazos bem definidos para todo o grupo.
          </p>
        </div>

        {currentRole === 'admin' && (
          <Button variant="coral" size="md" icon={<Plus className="w-4 h-4" />}>
            Nova Enquete (Admin)
          </Button>
        )}
      </div>

      {/* ── REGRAS DE VOTAÇÃO ──────────────────────────────────────────────── */}
      <aside aria-label="Informações sobre regras de votação" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-turquoise-50 text-tropical-ocean flex items-center justify-center shrink-0 shadow-xs">
          <HelpCircle className="w-5 h-5 text-tropical-ocean" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Como funcionam as votações no Rota de Verão?
          </p>
          <p className="text-tropical-text-muted">
            Cada participante autenticado tem direito a 1 voto por enquete. Você pode mudar seu voto a qualquer momento antes do prazo de encerramento. Os percentuais são atualizados instantaneamente conforme os amigos votam.
          </p>
        </div>
      </aside>

      {/* ── LISTA DE ENQUETES ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        {pollsList.map((poll) => (
          <div
            key={poll.id}
            className="tropical-card p-6 md:p-8 space-y-5 border-t-4 border-t-tropical-ocean"
          >
            {/* Topo da Enquete */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tropical-sand-border/30 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={poll.isClosed ? 'danger' : 'palm'} size="sm">
                    {poll.isClosed ? 'Enquete Encerrada' : 'Votação Aberta'}
                  </Badge>
                  <span className="text-xs text-tropical-text-muted font-bold">
                    {poll.totalVotes} votos computados
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-tropical-text mt-1.5">
                  {poll.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-tropical-coral bg-tropical-coral-50 px-3.5 py-1.5 rounded-full border border-tropical-coral-200 shrink-0">
                <Clock className="w-3.5 h-3.5 text-tropical-coral" />
                <span>Encerra: {poll.deadline}</span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-tropical-text-secondary leading-relaxed">
              {poll.description}
            </p>

            {/* Opções de Voto com Barras e Estados Ativos */}
            <div className="space-y-3 pt-1">
              {poll.options.map((option) => {
                const isSelected = poll.userVotedOptionId === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleVote(poll.id, option.id)}
                    className={`p-4 md:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-tropical-ocean bg-tropical-turquoise/10 shadow-tropical-sm'
                        : 'border-tropical-sand-border/60 bg-white hover:border-tropical-turquoise hover:bg-tropical-sand-50/40'
                    }`}
                  >
                    {/* Barra de Progresso Suave no Fundo */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-tropical-turquoise/15 transition-all duration-700 ease-out pointer-events-none"
                      style={{ width: `${option.percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                            isSelected
                              ? 'border-tropical-ocean bg-tropical-ocean text-white shadow-xs'
                              : 'border-tropical-sand-border bg-white text-transparent group-hover:border-tropical-turquoise'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <div className="font-bold text-sm md:text-base text-tropical-text flex items-center gap-2">
                            {option.title}
                            {isSelected && (
                              <span className="badge-tropical bg-tropical-ocean text-white text-[10px] px-2 py-0.5 font-bold">
                                Seu voto
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <div className="text-xs text-tropical-text-muted mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-display font-extrabold text-xl md:text-2xl text-tropical-ocean">
                          {option.percentage}%
                        </span>
                        <span className="block text-[11px] font-semibold text-tropical-text-muted">
                          {option.voteCount} {option.voteCount === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-tropical-sand-border/30 text-xs text-tropical-text-muted gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-tropical-palm" />
                {poll.allowsChangeVote
                  ? 'Você pode alterar sua escolha a qualquer momento antes do prazo.'
                  : 'Voto definitivo (não permite alteração).'}
              </span>
              <span className="font-bold text-tropical-ocean">
                {poll.userVotedOptionId ? '✓ Seu voto está confirmado!' : 'Clique em qualquer opção acima para votar'}
              </span>
            </div>

          </div>
        ))}
      </div>

    </PageShell>
  );
};
