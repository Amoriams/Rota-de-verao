import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  UserPlus, 
  KeyRound, 
  Edit3, 
  History, 
  Copy, 
  Check, 
  Calendar, 
  MapPin 
} from 'lucide-react';
import { MOCK_TRIP, MOCK_PARTICIPANTS, MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const Admin: React.FC = () => {
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const tripData = MOCK_TRIP;
  const participants = MOCK_PARTICIPANTS;

  // Simulação de cópia do link de convite
  const handleCopyInvite = (id: string) => {
    const inviteUrl = `${window.location.origin}/entrar?token=demo-token-${id}&pin=152749`;
    navigator.clipboard?.writeText?.(inviteUrl);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-coastal-sand/50 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
              Painel de Administração
            </h1>
            <Badge variant="coral" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Exclusivo da Organizadora
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Gestão estrutural da viagem, emissão e revogação de convites e auditoria de alterações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="coral" size="md" icon={<UserPlus className="w-4 h-4" />}>
            Convidar Novo Amigo
          </Button>
        </div>
      </div>

      {/* Seção 1: Configurações Gerais da Viagem */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
            <Settings className="w-5 h-5 text-coastal-ocean" />
            Parâmetros da Viagem
          </h2>
          <Button variant="outline" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}>
            Editar Informações
          </Button>
        </div>

        <Card padding="lg" className="space-y-4 border-t-4 border-t-coastal-ocean">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase block">Nome da Viagem</span>
              <div className="font-display font-bold text-lg text-coastal-ocean mt-0.5">
                {tripData.title}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase block">Destino Oficial</span>
              <div className="font-display font-bold text-lg text-coastal-ocean mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-coastal-coral" />
                {tripData.destination} &bull; {tripData.state}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase block">Período</span>
              <div className="font-display font-bold text-lg text-coastal-ocean mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-coastal-water-dark" />
                {tripData.startDate} a {tripData.endDate}
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 border-t border-coastal-sand/40 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Somente a administradora (Mariana) tem autorização para alterar as datas e o destino.</span>
          </div>
        </Card>
      </section>

      {/* Seção 2: Gerenciamento de Convites e PINs de Acesso */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-coastal-coral" />
              Gestão de Convites & Códigos PIN
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada participante possui um link direto e um código PIN exclusivo de 6 dígitos.
            </p>
          </div>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-coastal-sand-light/60 text-coastal-ocean uppercase text-[11px] font-semibold border-b border-coastal-sand-border">
                <tr>
                  <th className="py-3 px-4">Convidado</th>
                  <th className="py-3 px-4">Papel</th>
                  <th className="py-3 px-4">PIN de Acesso</th>
                  <th className="py-3 px-4">Status de Presença</th>
                  <th className="py-3 px-4 text-right">Link de Convite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coastal-sand/40">
                {participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-coastal-offwhite transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-semibold text-coastal-ocean">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.phone || 'Sem telefone'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={p.role === 'admin' ? 'coral' : 'neutral'} size="sm">
                        {p.role === 'admin' ? 'Organizadora' : 'Convidado'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-coastal-ocean">
                      <span className="bg-coastal-sand-light/70 px-2 py-0.5 rounded border border-coastal-sand">
                        {152700 + idx}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={p.status === 'confirmed' ? 'success' : p.status === 'declined' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {p.status === 'confirmed' ? 'Confirmado' : p.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={copiedTokenId === p.id ? 'secondary' : 'outline'}
                        onClick={() => handleCopyInvite(p.id)}
                        icon={copiedTokenId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedTokenId === p.id ? 'Copiado!' : 'Copiar Link'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Seção 3: Trilha de Auditoria (Activity Logs) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-coastal-ocean flex items-center gap-2">
              <History className="w-5 h-5 text-coastal-ocean" />
              Histórico de Auditoria Imutável
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro formal de todas as ações relevantes realizadas na viagem.
            </p>
          </div>
        </div>

        <Card padding="md" className="space-y-3">
          <div className="divide-y divide-slate-100">
            {MOCK_ACTIVITY_LOGS.map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs md:text-sm">
                <div className="space-y-0.5">
                  <div className="font-semibold text-coastal-ocean">
                    {log.actorName} <span className="font-normal text-slate-600">({log.action})</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Alvo: <span className="font-mono text-slate-700">{log.target}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 text-slate-400 text-xs">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

    </div>
  );
};
