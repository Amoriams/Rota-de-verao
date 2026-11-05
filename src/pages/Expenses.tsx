import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  HelpCircle
} from 'lucide-react';
import { MOCK_EXPENSES } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { PageShell } from '../components/layout/PageShell';

export const Expenses: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalTripAmount = MOCK_EXPENSES.reduce((sum, item) => sum + item.totalAmount, 0);

  // Extrato simulado de Carol (Participante logada de exemplo)
  const myEstimatedTotal = 700.00 + 323.75 + 200.00; // Casa + Carro 01 + Mercado

  const filteredExpenses = selectedCategory === 'all'
    ? MOCK_EXPENSES
    : MOCK_EXPENSES.filter(e => e.category === selectedCategory);

  const getSplitLabel = (type: string) => {
    switch (type) {
      case 'equal_all_confirmed':
        return 'Dividido entre todos os confirmados';
      case 'vehicle_users':
        return 'Dividido apenas entre ocupantes do carro';
      case 'individual':
        return 'Despesa individual';
      default:
        return 'Divisão personalizada';
    }
  };

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Receipt className="w-3.5 h-3.5 text-tropical-ocean" />
              Gestão Financeira
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Financeiro & Divisão de Custos
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Transparência contábil completa: cálculos matemáticos exatos e extrato individual sem atrito.
          </p>
        </div>
      </div>

      {/* ── A REGRA DOS 4 PASSOS FINANCEIROS ───────────────────────────────── */}
      <aside aria-label="Informações sobre separação dos 4 conceitos financeiros" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-6 shadow-tropical-sm space-y-4">
        <div className="flex items-center gap-2.5 text-tropical-ocean font-bold text-base">
          <HelpCircle className="w-5 h-5 text-tropical-ocean" />
          Como Funciona o Rateio Justo no Rota de Verão
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-tropical-sand-50/50 rounded-2xl border border-tropical-sand-border/50 space-y-1">
            <span className="font-extrabold text-tropical-ocean block text-sm">1. Confirmação</span>
            <p className="text-tropical-text-secondary leading-relaxed">Mostra quem vai viajar. Não cria débito automático.</p>
          </div>
          <div className="p-4 bg-tropical-sand-50/50 rounded-2xl border border-tropical-sand-border/50 space-y-1">
            <span className="font-extrabold text-tropical-turquoise-700 block text-sm">2. Interesse Real</span>
            <p className="text-tropical-text-secondary leading-relaxed">Inscrição no rateio daquele item (ex: entrar no Carro 01).</p>
          </div>
          <div className="p-4 bg-tropical-sand-50/50 rounded-2xl border border-tropical-sand-border/50 space-y-1">
            <span className="font-extrabold text-tropical-coral block text-sm">3. Cota Calculada</span>
            <p className="text-tropical-text-secondary leading-relaxed">O valor exato dividido apenas entre os envolvidos.</p>
          </div>
          <div className="p-4 bg-tropical-sand-50/50 rounded-2xl border border-tropical-sand-border/50 space-y-1">
            <span className="font-extrabold text-tropical-palm block text-sm">4. Quitação (Pix)</span>
            <p className="text-tropical-text-secondary leading-relaxed">Pagamento externo direto à organizadora.</p>
          </div>
        </div>
      </aside>

      {/* ── CARTÕES DE RESUMO FINANCEIRO ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total da Viagem */}
        <div className="tropical-card p-6 space-y-2 border-l-4 border-l-tropical-ocean">
          <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider block">
            Total Lançado da Viagem
          </span>
          <div className="text-3xl font-extrabold font-display text-tropical-text">
            R$ {totalTripAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-tropical-text-muted">
            Soma de 4 despesas cadastradas para o grupo
          </p>
        </div>

        {/* Extrato Pessoal de Carol */}
        <div className="tropical-card p-6 space-y-2 border-l-4 border-l-tropical-coral bg-tropical-coral-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tropical-coral uppercase tracking-wider">
              Sua Responsabilidade
            </span>
            <span className="badge-tropical bg-tropical-coral text-white text-[10px]">
              Seu Extrato
            </span>
          </div>
          <div className="text-3xl font-extrabold font-display text-tropical-coral">
            R$ {myEstimatedTotal.toFixed(2)}
          </div>
          <p className="text-xs text-tropical-text-secondary">
            Cota na Casa (R$ 700) + Carro 01 (R$ 323,75) + Mercado (R$ 200)
          </p>
        </div>

        {/* Status de Pagamentos */}
        <div className="tropical-card p-6 space-y-2 border-l-4 border-l-tropical-palm">
          <span className="text-xs font-bold text-tropical-text-muted uppercase tracking-wider block">
            Pagamentos Quitado
          </span>
          <div className="text-3xl font-extrabold font-display text-tropical-palm">
            0%
          </div>
          <p className="text-xs text-tropical-text-muted">
            Aguardando fechamento da casa pela organizadora
          </p>
        </div>

      </div>

      {/* ── TABELA DE DESPESAS DETALHADA COM FILTROS ───────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
            <Receipt className="w-5 h-5 text-tropical-ocean" />
            Demonstrativo de Gastos da Viagem
          </h2>

          {/* Filtro de Categorias */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-tropical-sand-border/60 shadow-tropical-sm">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedCategory('accommodation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'accommodation'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Hospedagem
            </button>
            <button
              onClick={() => setSelectedCategory('vehicle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'vehicle'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Veículos
            </button>
            <button
              onClick={() => setSelectedCategory('food')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'food'
                  ? 'bg-tropical-ocean text-white shadow-tropical-sm'
                  : 'text-tropical-text-secondary hover:text-tropical-ocean'
              }`}
            >
              Alimentação
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="tropical-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={expense.category === 'accommodation' ? 'ocean' : expense.category === 'vehicle' ? 'palm' : 'sand'} size="sm">
                      {expense.category === 'accommodation' ? 'Hospedagem' : expense.category === 'vehicle' ? 'Veículo' : 'Mercado'}
                    </Badge>
                    <span className="text-xs text-tropical-text-muted font-medium">
                      Critério: <strong className="text-tropical-text">{getSplitLabel(expense.splitCriterion)}</strong>
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-tropical-text mt-1.5">
                    {expense.title}
                  </h3>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-tropical-text-muted font-bold uppercase block">Valor Total</span>
                  <span className="text-2xl font-extrabold font-display text-tropical-ocean">
                    R$ {expense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Detalhe do Cálculo Matemático */}
              <div className="p-4 rounded-2xl bg-tropical-sand-50/70 border border-tropical-sand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-tropical-text block">Fórmula de Divisão:</span>
                  <span className="text-tropical-text-secondary">
                    R$ {expense.totalAmount.toFixed(2)} &divide; {expense.participantsCount} pessoas envolvidas
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="font-bold text-tropical-text block">Cota Individual:</span>
                  <span className="text-base font-extrabold text-tropical-coral font-display">
                    R$ {expense.assignedAmountPerPerson.toFixed(2)} / pessoa
                  </span>
                </div>
              </div>

              <div className="text-xs text-tropical-text-muted flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-tropical-sand-border/30">
                <span>
                  <strong>Participantes no rateio:</strong> {expense.involvedParticipantNames.join(', ')}
                </span>
                {expense.dueDate && (
                  <span className="text-tropical-coral font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Vencimento: {expense.dueDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </PageShell>
  );
};
