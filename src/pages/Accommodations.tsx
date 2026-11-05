import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Bed, 
  ExternalLink, 
  Vote, 
  Star, 
  Info,
  Building2,
  Sparkles
} from 'lucide-react';
import { MOCK_ACCOMMODATIONS } from '../data/mockData';
import { Button } from '../components/common/Button';
import { PageShell } from '../components/layout/PageShell';

export const Accommodations: React.FC = () => {
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, number>>({
    'acc-1': 0,
    'acc-2': 0,
    'acc-3': 0,
  });

  const handleSelectThumbnail = (accId: string, index: number) => {
    setSelectedPhotos(prev => ({ ...prev, [accId]: index }));
  };

  return (
    <PageShell className="space-y-8 animate-fade-in pb-16">
      
      {/* ── CABEÇALHO DA PÁGINA ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-tropical-sand-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-tropical bg-tropical-turquoise/15 text-tropical-ocean border border-tropical-turquoise/30">
              <Building2 className="w-3.5 h-3.5 text-tropical-ocean" />
              Estadia da Turma
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-tropical-text mt-1.5">
            Opções de Hospedagem
          </h1>
          <p className="text-tropical-text-muted text-sm mt-0.5">
            Casas e pousadas selecionadas pela organizadora para a nossa estadia em Cumbuco, Ceará.
          </p>
        </div>

        <Link to="/enquetes">
          <Button variant="coral" size="md" icon={<Vote className="w-4 h-4" />}>
            Votar na sua Casa Preferida
          </Button>
        </Link>
      </div>

      {/* ── NOTA EXPLICATIVA SOBRE RESERVA ─────────────────────────────────── */}
      <aside aria-label="Informações sobre reserva e despesas" className="bg-white border border-tropical-sand-border/60 rounded-3xl p-5 shadow-tropical-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-tropical-sand-100 text-tropical-text flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-5 h-5 text-tropical-coral" />
        </div>
        <div className="text-xs md:text-sm text-tropical-text leading-relaxed space-y-1">
          <p className="font-bold text-tropical-ocean">
            Como funciona a escolha democrática da casa?
          </p>
          <p className="text-tropical-text-muted">
            Cadastramos as melhores opções encontradas com capacidade para acolher confortavelmente todos os amigos.
            O valor estimado por pessoa é calculado dividindo o valor total pelos participantes que confirmarem presença.
            Nenhuma cobrança ou reserva é finalizada sem a aprovação da maioria na votação oficial.
          </p>
        </div>
      </aside>

      {/* ── GRID DE ACOMODAÇÕES COM FOTOGRAFIA EDITORIAL ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {MOCK_ACCOMMODATIONS.map((acc) => {
          const currentPhotoIndex = selectedPhotos[acc.id] || 0;

          return (
            <div
              key={acc.id}
              className={`tropical-card overflow-hidden flex flex-col justify-between group ${
                acc.isFavorite ? 'border-2 border-tropical-ocean ring-4 ring-tropical-ocean/5 shadow-tropical' : ''
              }`}
            >
              <div>
                {/* Imagem Principal */}
                <div className="relative h-64 overflow-hidden bg-tropical-sand-100">
                  <img
                    src={acc.photos[currentPhotoIndex]}
                    alt={acc.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {acc.isFavorite && (
                    <div className="absolute top-3 left-3">
                      <span className="badge-tropical bg-tropical-coral text-white shadow-tropical-sm">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        Opção Mais Votada
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full font-semibold">
                    Foto {currentPhotoIndex + 1} de {acc.photos.length}
                  </div>
                </div>

                {/* Miniaturas de Fotos */}
                {acc.photos.length > 1 && (
                  <div className="flex gap-2 p-2.5 bg-tropical-sand-50/70 border-b border-tropical-sand-border/40 overflow-x-auto">
                    {acc.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectThumbnail(acc.id, idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          currentPhotoIndex === idx
                            ? 'border-tropical-ocean scale-105 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Conteúdo do Card */}
                <div className="p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-tropical-text leading-snug">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-tropical-text-muted flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-tropical-coral shrink-0" />
                      {acc.address}
                    </p>
                  </div>

                  {/* Capacidade e Quartos */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-tropical-sand-border/40 text-xs">
                    <div className="flex items-center gap-1.5 text-tropical-text font-semibold">
                      <Bed className="w-4 h-4 text-tropical-ocean" />
                      <span>{acc.bedroomsCount} quartos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-tropical-text font-semibold">
                      <Users className="w-4 h-4 text-tropical-palm" />
                      <span>Até {acc.totalCapacity} pessoas</span>
                    </div>
                  </div>

                  {/* Comodidades */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-tropical-text-muted uppercase tracking-wider block">
                      Destaques da casa
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {acc.amenities.map((amenity, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-tropical-sand-50 text-tropical-text-secondary border border-tropical-sand-border/50 font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé com Valores e Ações */}
              <div className="p-5 md:p-6 bg-tropical-sand-50/50 border-t border-tropical-sand-border/40 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-tropical-text-muted font-bold block">
                      Estimativa individual
                    </span>
                    <span className="text-2xl font-extrabold font-display text-tropical-ocean">
                      R$ {acc.pricePerPersonEstimated.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-tropical-text-muted block">
                      (dividido pelos 10 amigos)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-tropical-text-muted font-bold block">
                      Total da estadia
                    </span>
                    <span className="text-sm font-bold text-tropical-text">
                      R$ {acc.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={acc.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" fullWidth icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Anúncio Original
                    </Button>
                  </a>
                  <Link to="/enquetes">
                    <Button variant="coral" size="sm" icon={<Vote className="w-3.5 h-3.5" />}>
                      Votar
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── TABELA COMPARATIVA VISUAL ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-tropical-sand-border/50 p-6 shadow-tropical-sm space-y-4">
        <h3 className="font-display font-bold text-lg text-tropical-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-tropical-turquoise" />
          Comparativo Rápido das 3 Opções
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-tropical-sand-border/50 text-tropical-text-muted uppercase text-[11px]">
                <th className="py-3 px-4 font-bold">Hospedagem</th>
                <th className="py-3 px-4 font-bold">Quartos</th>
                <th className="py-3 px-4 font-bold">Capacidade</th>
                <th className="py-3 px-4 font-bold">Localização</th>
                <th className="py-3 px-4 font-bold">Total</th>
                <th className="py-3 px-4 font-bold">Por Pessoa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tropical-sand-border/30">
              {MOCK_ACCOMMODATIONS.map(acc => (
                <tr key={acc.id} className="hover:bg-tropical-sand-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-tropical-text flex items-center gap-1.5">
                    {acc.isFavorite && <Star className="w-3.5 h-3.5 text-tropical-coral fill-tropical-coral" />}
                    {acc.name}
                  </td>
                  <td className="py-3.5 px-4 text-tropical-text-secondary">{acc.bedroomsCount} suítes</td>
                  <td className="py-3.5 px-4 text-tropical-text-secondary">Até {acc.totalCapacity} pessoas</td>
                  <td className="py-3.5 px-4 text-tropical-text-muted">{acc.address.split(',')[0]}</td>
                  <td className="py-3.5 px-4 font-semibold text-tropical-text">
                    R$ {acc.totalAmount.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-tropical-ocean">
                    R$ {acc.pricePerPersonEstimated.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </PageShell>
  );
};
