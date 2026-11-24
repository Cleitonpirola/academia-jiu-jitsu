import { MapPin } from 'lucide-react';

export function CidadeTreino({ cidade }: { cidade?: string | null }) {
  if (!cidade?.trim()) return null;
  return <span className="cidade-treino" aria-label={`Cidade: ${cidade}`}><MapPin size={13} aria-hidden="true"/><span>{cidade}</span></span>;
}
