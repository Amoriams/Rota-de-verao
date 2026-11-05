import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Bed, 
  ExternalLink, 
  Vote, 
  Star, 
  Info
} from 'lucide-react';
import { MOCK_ACCOMMODATIONS } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
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
    <PageShell>
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-coastal-ocean">
            Opções de Hospedagem
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Casas e pousadas selecionadas pela organizadora para a nossa estadia em Cumbuco.
          </p>
        </div>

        <Link to="/enquetes">
          <Button variant="coral" size="md" icon={<Vote className="w-4 h-4" />}>
            Votar na sua Casa Preferida
          </Button>
        </Link>
      </div>

      {/* Nota Explicativa */}
      <aside aria-label="Informações sobre reserva e despesas" className="bg-coastal-sand-light/60 border border-coastal-sand-border rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-coastal-ocean-700 shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-slate-700 leading-relaxed">
          <strong className="font-semibold text-coastal-ocean">Como funciona a escolha?</strong> Cadastramos as melhores opções encontradas com capacidade para o grupo. Todos os participantes confirmados votam na sua favorita. O valor estimado por pessoa é calculado dividindo o valor total pelos integrantes que confirmarem presença. Nenhuma reserva ou cobrança é feita aqui dentro do app.
        </div>
      </aside>

      {/* Grid de Acomodações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {MOCK_ACCOMMODATIONS.map((acc) => {
          const currentPhotoIndex = selectedPhotos[acc.id] || 0;

          return (
            <Card key={acc.id} padding="none" className="overflow-hidden flex flex-col justify-between border-t-4 border-t-coastal-ocean">
              
              <div>
                {/* Imagem Principal com Badge de Destaque */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={acc.photos[currentPhotoIndex]}
                    alt={acc.name}
                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                  />
                  {acc.isFavorite && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="coral" size="sm" icon={<Star className="w-3.5 h-3.5 fill-current" />}>
                        Mais Votada
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                    Foto {currentPhotoIndex + 1} de {acc.photos.length}
                  </div>
                </div>

                {/* Miniaturas de Fotos */}
                {acc.photos.length > 1 && (
                  <div className="flex gap-2 p-3 bg-coastal-offwhite border-b border-coastal-sand/40 overflow-x-auto">
                    {acc.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectThumbnail(acc.id, idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          currentPhotoIndex === idx
                            ? 'border-coastal-ocean scale-105 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Conteúdo do Card */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-coastal-ocean leading-snug">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-coastal-coral shrink-0" />
                      {acc.address}
                    </p>
                  </div>

                  {/* Capacidade e Quartos */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-coastal-sand/40 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Bed className="w-4 h-4 text-coastal-ocean" />
                      <span>{acc.bedroomsCount} quartos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Users className="w-4 h-4 text-coastal-ocean" />
                      <span>Até {acc.totalCapacity} pessoas</span>
                    </div>
                  </div>

                  {/* Comodidades */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Destaques da casa
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {acc.amenities.map((amenity, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-coastal-sand-light/60 text-coastal-ocean-700 border border-coastal-sand/60 font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé com Valores e Ações */}
              <div className="p-5 bg-coastal-offwhite border-t border-coastal-sand/40 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Estimativa individual
                    </span>
                    <span className="text-xl font-bold font-display text-coastal-ocean">
                      R$ {acc.pricePerPersonEstimated.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      (dividido em 10 pessoas)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                      Total da estadia
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      R$ {acc.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <a
                    href={acc.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" fullWidth icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Conferir no Anúncio
                    </Button>
                  </a>
                  <Link to="/enquetes">
                    <Button variant="primary" size="sm" icon={<Vote className="w-3.5 h-3.5" />}>
                      Votar
                    </Button>
                  </Link>
                </div>
              </div>

            </Card>
          );
        })}
      </div>

    </div>
    </PageShell>
  );
};
