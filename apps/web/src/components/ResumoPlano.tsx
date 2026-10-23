import { CalendarCheck, Infinity as InfinityIcon } from 'lucide-react';
import type { UsoPlano } from '@tatame/shared';
import { dateLabel } from '../lib';

export function ResumoPlano({ uso }: { uso: UsoPlano }) {
  return <section className="plan-summary" aria-label="Uso do plano nesta semana">
    <div className="plan-summary-title">{uso.limiteSemanal === null ? <InfinityIcon size={23}/> : <CalendarCheck size={23}/>}<div><strong>{uso.nome}</strong><small>{uso.limiteSemanal === null ? 'Treinos ilimitados' : `${uso.limiteSemanal} ${uso.limiteSemanal === 1 ? 'aula' : 'aulas'} por semana`}</small></div></div>
    <div className="plan-usage"><strong>{uso.utilizadas}{uso.limiteSemanal === null ? '' : ` / ${uso.limiteSemanal}`}</strong><span>aulas utilizadas{uso.extrasUtilizadas > 0 ? ` + ${uso.extrasUtilizadas} extra(s) autorizada(s)` : ''}</span><small>{dateLabel(uso.inicioSemana)} a {dateLabel(uso.fimSemana)}</small></div>
    <p className="helper plan-summary-note">{uso.limiteSemanal === null ? 'Você pode participar de várias aulas, inclusive no mesmo dia.' : uso.limiteAtingido ? 'Limite semanal atingido. Converse com a academia para liberar uma aula extra.' : `${uso.restantes} aula(s) disponível(is) nesta semana.`} Check-in pendente ocupa uma vaga; ausência registrada ou aula cancelada libera.</p>
  </section>;
}
