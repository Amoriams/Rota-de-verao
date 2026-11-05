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
  MapPin,
  Shield
} from 'lucide-react';
import { MOCK_TRIP, MOCK_PARTICIPANTS, MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';

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
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-coral-50 text-tropical-coral border border-tropical-coral-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Área Administrativa
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Painel da Organizadora
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Gestão estrutural da viagem, emissão de convites, códigos PIN e auditoria de alterações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="coral" size="md" icon={<UserPlus className="w-4 h-4" />}>
            Convidar Novo Amigo
          </Button>
        </div>
      </div>

      {/* ── SEÇÃO 1: PARÂMETROS DA VIAGEM ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-tropical-ocean" />
            Parâmetros Gerais da Viagem
          </h2>
          <Button variant="outline" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}>
            Editar Informações
          </Button>
        </div>

        <div className="tropical-card p-6 md:p-8 space-y-5 border-t-4 border-t-tropical-ocean">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-tropical-text-muted font-bold uppercase tracking-wider block">Nome Oficial</span>
              <div className="font-display font-bold text-lg text-tropical-text mt-1">
                {tripData.title}
              </div>
            </div>

            <div>
              <span className="text-xs text-tropical-text-muted font-bold uppercase tracking-wider block">Destino Escolhido</span>
              <div className="font-display font-bold text-lg text-tropical-ocean mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-tropical-coral" />
                {tripData.destination} &bull; {tripData.state}
              </div>
            </div>

            <div>
              <span className="text-xs text-tropical-text-muted font-bold uppercase tracking-wider block">Período da Viagem</span>
              <div className="font-display font-bold text-lg text-tropical-text mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-tropical-turquoise" />
                {tripData.startDate} a {tripData.endDate}
              </div>
            </div>
          </div>

          <div className="pt-4 text-xs text-tropical-text-muted border-t border-tropical-sand-border/30 flex items-center gap-2">
            <Shield className="w-4 h-4 text-tropical-palm" />
            <span>Somente você como administradora tem privilégios de alterar as datas centrais e o destino.</span>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: GERENCIAMENTO DE CONVITES E CÓDIGOS PIN ───────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-tropical-coral" />
              Gestão de Convites & Códigos PIN
            </h2>
            <p className="text-xs text-tropical-text-muted mt-0.5">
              Cada participante possui um link direto e um código PIN exclusivo de 6 dígitos para login seguro.
            </p>
          </div>
        </div>

        <div className="tropical-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-tropical-sand-50/80 text-tropical-text uppercase text-[11px] font-bold border-b border-tropical-sand-border/50">
                <tr>
                  <th className="py-3.5 px-5">Convidado</th>
                  <th className="py-3.5 px-4">Papel</th>
                  <th className="py-3.5 px-4">PIN de Acesso</th>
                  <th className="py-3.5 px-4">Presença</th>
                  <th className="py-3.5 px-5 text-right">Link de Convite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tropical-sand-border/30">
                {participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-tropical-sand-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img src={p.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-tropical-sand-border" />
                        <div>
                          <div className="font-bold text-tropical-text">{p.name}</div>
                          <div className="text-[11px] text-tropical-text-muted">{p.phone || 'Sem telefone'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={p.role === 'admin' ? 'coral' : 'neutral'} size="sm">
                        {p.role === 'admin' ? 'Organizadora' : 'Convidado'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-tropical-ocean">
                      <span className="bg-tropical-sand-50 px-2.5 py-1 rounded-lg border border-tropical-sand-border/60">
                        {152700 + idx}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={p.status === 'confirmed' ? 'palm' : p.status === 'declined' ? 'danger' : 'sand'}
                        size="sm"
                      >
                        {p.status === 'confirmed' ? 'Confirmado' : p.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <Button
                        size="sm"
                        variant={copiedTokenId === p.id ? 'secondary' : 'outline'}
                        onClick={() => handleCopyInvite(p.id)}
                        icon={copiedTokenId === p.id ? <Check className="w-3.5 h-3.5 text-tropical-palm" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedTokenId === p.id ? 'Copiado!' : 'Copiar Link'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: HISTÓRICO DE AUDITORIA ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-tropical-text flex items-center gap-2">
              <History className="w-5 h-5 text-tropical-ocean" />
              Histórico de Auditoria Imutável
            </h2>
            <p className="text-xs text-tropical-text-muted mt-0.5">
              Registro formal e seguro de todas as ações relevantes realizadas na viagem.
            </p>
          </div>
        </div>

        <div className="tropical-card p-6 md:p-8 space-y-4">
          <div className="divide-y divide-tropical-sand-border/30">
            {MOCK_ACTIVITY_LOGS.map((log) => (
              <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs md:text-sm">
                <div className="space-y-1">
                  <div className="font-bold text-tropical-text">
                    {log.actorName} <span className="font-normal text-tropical-text-muted">({log.action})</span>
                  </div>
                  <div className="text-xs text-tropical-text-muted">
                    Alvo: <span className="font-mono text-tropical-text-secondary">{log.target}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 text-tropical-text-muted text-xs font-mono">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PageShell>
  );
};
