import { LockKeyhole, RefreshCw } from 'lucide-react';
import type { BloqueioAluno } from '@tatame/shared';
import { Button } from '../components';
import { dateLabel, money } from '../lib';

export function BloqueioFinanceiro({ bloqueio, loading, onRefresh }: { bloqueio: BloqueioAluno; loading: boolean; onRefresh: () => void }) {
  const total = bloqueio.pendencias.reduce((sum, item) => sum + item.valorCentavos, 0);
  return <section className="card financial-lock" aria-labelledby="financial-lock-title">
    <span className="financial-lock-icon"><LockKeyhole size={28}/></span>
    <div className="eyebrow">REGULARIZAÇÃO DA MENSALIDADE</div>
    <h2 id="financial-lock-title">Débito em aberto</h2>
    <p className="financial-lock-message" role="status">{bloqueio.mensagem}</p>
    <div className="financial-lock-summary"><span>{bloqueio.pendencias.length} {bloqueio.pendencias.length === 1 ? 'mensalidade vencida' : 'mensalidades vencidas'}</span><strong>{money(total)}</strong></div>
    <div className="financial-lock-bills">{bloqueio.pendencias.map(item => <div key={item.id}><div><strong>Mensalidade · {item.competencia.split('-').reverse().join('/')}</strong><span>Venceu em {dateLabel(item.dataVencimento)}</span></div><strong>{money(item.valorCentavos)}</strong></div>)}</div>
    <p className="helper">O acesso às aulas, ao check-in e às demais áreas será liberado quando a academia registrar o pagamento de todas as mensalidades vencidas. Seu cadastro e seu histórico continuam preservados.</p>
    <Button disabled={loading} onClick={onRefresh}><RefreshCw size={16}/>{loading ? 'Verificando…' : 'Verificar liberação do acesso'}</Button>
    <p className="helper">Já realizou o pagamento? Avise seu professor para que ele registre a confirmação no sistema.</p>
  </section>;
}
