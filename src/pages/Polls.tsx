import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  HelpCircle,
  Check
} from 'lucide-react';
import { MOCK_POLLS } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Poll } from '../types';

interface PollsProps {
  currentRole: 'admin' | 'member';
}

export const Polls: React.FC<PollsProps> = ({ currentRole }) => {
  const [pollsList, setPollsList] = useState<Poll[]>(MOCK_POLLS);

  // Simulação de registro de voto
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
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Votações & Decisões Democráticas
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Escolhas em grupo com prazos definidos e apuração transparente para todos os participantes.
          </p>
        </div>

        {currentRole === 'admin' && (
          <Button variant="coral" size="md" icon={<Plus className="w-4 h-4" />}>
            Nova Enquete (Admin)
          </Button>
        )}
      </div>

      {/* Regras de Votação */}
      <aside aria-label="Informações sobre regras de votação" className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-coastal-water-dark shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-cyan-950 leading-relaxed">
          <strong>Como funcionam os votos?</strong> Cada participante autenticado possui direito a 1 voto único por enquete. A administradora pode configurar se é permitido alterar o voto antes do encerramento do prazo. Os resultados parciais são atualizados instantaneamente.
        </div>
      </aside>

      {/* Lista de Enquetes */}
      <div className="space-y-6">
        {pollsList.map((poll) => (
          <Card key={poll.id} padding="lg" className="space-y-5 border-t-4 border-t-coastal-ocean">
            
            {/* Topo da Enquete */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coastal-sand/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={poll.isClosed ? 'danger' : 'success'} size="sm">
                    {poll.isClosed ? 'Enquete Encerrada' : 'Votação Aberta'}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {poll.totalVotes} votos computados
                  </span>
                </div>
                <h2 className="font-display font-bold text-xl text-coastal-ocean mt-1">
                  {poll.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Encerra: {poll.deadline}</span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {poll.description}
            </p>

            {/* Opções de Voto */}
            <div className="space-y-3 pt-2">
              {poll.options.map((option) => {
                const isSelected = poll.userVotedOptionId === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleVote(poll.id, option.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-coastal-ocean bg-coastal-ocean-50/50 shadow-sm'
                        : 'border-coastal-sand/60 bg-white hover:border-coastal-water hover:bg-coastal-offwhite'
                    }`}
                  >
                    {/* Barra de Progresso de Fundo */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-coastal-ocean-100/40 transition-all duration-500 pointer-events-none"
                      style={{ width: `${option.percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? 'border-coastal-ocean bg-coastal-ocean text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-coastal-ocean flex items-center gap-2">
                            {option.title}
                            {isSelected && (
                              <Badge variant="ocean" size="sm">Seu voto</Badge>
                            )}
                          </div>
                          {option.description && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-display font-bold text-lg text-coastal-ocean">
                          {option.percentage}%
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {option.voteCount} {option.voteCount === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                {poll.allowsChangeVote
                  ? 'Você pode alterar sua escolha a qualquer momento antes do prazo.'
                  : 'Voto definitivo (não permite alteração).'}
              </span>
              <span className="font-medium text-coastal-ocean">
                {poll.userVotedOptionId ? 'Voto registrado com sucesso!' : 'Clique em uma opção para votar'}
              </span>
            </div>

          </Card>
        ))}
      </div>

    </div>
  );
};
