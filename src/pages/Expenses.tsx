import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  HelpCircle,
  Filter
} from 'lucide-react';
import { MOCK_EXPENSES } from '../data/mockData';
import { Card } from '../components/common/Card';
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
    <PageShell>
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Financeiro & Divisão Justa de Custos
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Transparência contábil completa: cálculos matemáticos exatos e extrato individual sem atrito.
          </p>
        </div>
      </div>

      {/* Regra de Ouro: Separação dos 4 Conceitos */}
      <aside aria-label="Informações sobre separação dos 4 conceitos financeiros" className="bg-coastal-ocean-50 border border-coastal-ocean-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-coastal-ocean font-bold text-sm">
          <HelpCircle className="w-5 h-5 text-coastal-ocean-600" />
          A Regra dos 4 Passos Financeiros no Rota de Verão
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-coastal-ocean-100 space-y-1">
            <span className="font-bold text-coastal-ocean block">1. Confirmação</span>
            <p className="text-slate-600">Mostra quem vai viajar. Não cria débito automático.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-coastal-ocean-100 space-y-1">
            <span className="font-bold text-coastal-ocean block">2. Interesse Real</span>
            <p className="text-slate-600">Inscrição no rateio daquele item (ex: entrar no Carro 01).</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-coastal-ocean-100 space-y-1">
            <span className="font-bold text-coastal-ocean block">3. Cota Calculada</span>
            <p className="text-slate-600">O valor exato dividido apenas entre os envolvidos.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-coastal-ocean-100 space-y-1">
            <span className="font-bold text-coastal-ocean block">4. Quitação (Pix)</span>
            <p className="text-slate-600">Pagamento externo direto à organizadora.</p>
          </div>
        </div>
      </aside>

      {/* Cartões de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total da Viagem */}
        <Card padding="md" className="space-y-2 border-l-4 border-l-coastal-ocean">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Lançado da Viagem
          </span>
          <div className="text-3xl font-bold font-display text-coastal-ocean">
            R$ {totalTripAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500">
            Soma de 4 despesas cadastradas até agora
          </p>
        </Card>

        {/* Extrato Pessoal de Carol */}
        <Card padding="md" className="space-y-2 border-l-4 border-l-coastal-coral bg-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-coastal-coral uppercase tracking-wider">
              Sua Responsabilidade Estimada
            </span>
            <Badge variant="coral" size="sm">Seu Extrato</Badge>
          </div>
          <div className="text-3xl font-bold font-display text-coastal-coral-dark">
            R$ {myEstimatedTotal.toFixed(2)}
          </div>
          <p className="text-xs text-slate-600">
            Sua cota na Casa (R$ 700) + Carro 01 (R$ 323,75) + Mercado (R$ 200)
          </p>
        </Card>

        {/* Status de Pagamentos */}
        <Card padding="md" className="space-y-2 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pagamentos Realizados
          </span>
          <div className="text-3xl font-bold font-display text-emerald-800">
            0%
          </div>
          <p className="text-xs text-slate-500">
            Aguardando fechamento da casa pela organizadora
          </p>
        </Card>

      </div>

      {/* Tabela de Despesas Detalhada */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
            <Receipt className="w-5 h-5 text-coastal-ocean" />
            Demonstrativo de Despesas da Viagem
          </h2>

          {/* Filtro de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-coastal-ocean text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedCategory('accommodation')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === 'accommodation'
                  ? 'bg-coastal-ocean text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hospedagem
            </button>
            <button
              onClick={() => setSelectedCategory('vehicle')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === 'vehicle'
                  ? 'bg-coastal-ocean text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Veículos
            </button>
            <button
              onClick={() => setSelectedCategory('food')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === 'food'
                  ? 'bg-coastal-ocean text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Alimentação
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} padding="md" className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="ocean" size="sm">
                      {expense.category === 'accommodation' ? 'Hospedagem' : expense.category === 'vehicle' ? 'Veículo' : 'Mercado'}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      Critério: <strong className="text-coastal-ocean">{getSplitLabel(expense.splitCriterion)}</strong>
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-coastal-ocean mt-1">
                    {expense.title}
                  </h3>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 block">Valor Total</span>
                  <span className="text-2xl font-bold font-display text-coastal-ocean">
                    R$ {expense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Detalhe do Cálculo Matemático */}
              <div className="p-3 rounded-xl bg-coastal-offwhite border border-coastal-sand/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block">Fórmula de Divisão:</span>
                  <span className="text-slate-600">
                    R$ {expense.totalAmount.toFixed(2)} &divide; {expense.participantsCount} pessoas envolvidas
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="font-semibold text-slate-700 block">Cota Individual:</span>
                  <span className="text-base font-bold text-coastal-coral-dark font-display">
                    R$ {expense.assignedAmountPerPerson.toFixed(2)} / pessoa
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-1">
                <span>
                  <strong>Participantes na divisão:</strong> {expense.involvedParticipantNames.join(', ')}
                </span>
                {expense.dueDate && (
                  <span className="text-amber-800 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Vencimento previsto: {expense.dueDate}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
    </PageShell>
  );
};
