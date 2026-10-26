import { useEffect, useState, type FormEvent } from 'react';
import type { Aluno, SaldoMensal } from '@tatame/shared';
import { Button, Field, FormError } from '../components';
import { api, money } from '../lib';
import { useAcademia } from '../store';

export function ResumoSaldoMensal({ saldo, valorAdicionalCentavos }: { saldo: SaldoMensal; valorAdicionalCentavos?: number | null }) {
  return <section className="card portal-panel" aria-label="Saldo de aulas do mês"><h3>Aulas restantes no mês</h3>
    <p><strong>{saldo.restantes === null ? 'Ilimitadas' : `${saldo.restantes} de ${saldo.limiteMensal}`}</strong> · {saldo.competencia.split('-').reverse().join('/')}</p>
    <p className="helper">{saldo.utilizadas} check-in(s) do plano no mês{saldo.adicionaisUtilizadas?` + ${saldo.adicionaisUtilizadas} aula(s) adicional(is)`:''}. O saldo renova no dia 1; aulas canceladas pela academia devolvem o crédito.</p>
    {saldo.limiteAtingido && <p className="portal-notice" role="alert"><strong>Você atingiu o limite de aulas do seu plano.</strong>{valorAdicionalCentavos!=null?` Para fazer mais aulas, você deverá pagar ${money(valorAdicionalCentavos)} por aula adicional. Escolha uma aula publicada na agenda.`:' Consulte a academia sobre aulas adicionais.'}</p>}
  </section>;
}
export function SaldoMensalAlunoEditor({ aluno }: { aluno: Aluno }) {
  const { reload } = useAcademia();
  const [saldo, setSaldo] = useState<SaldoMensal | null>(null);
  const [limitado, setLimitado] = useState(false), [limite, setLimite] = useState('12');
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { const controller = new AbortController(); setBusy(true);
    api<SaldoMensal>(`/alunos/${aluno.id}/saldo-mensal`, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) { setSaldo(result); setLimitado(result.limiteMensal !== null); setLimite(String(result.limiteMensal ?? 12)); }
    }).catch(error => { if (!controller.signal.aborted) setError((error as Error).message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [aluno.id]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { setSaldo(await api<SaldoMensal>(`/alunos/${aluno.id}/saldo-mensal`, { method: 'PUT', body: JSON.stringify({ limiteMensal: limitado ? Number(limite) : null }) })); await reload(); setNotice('Limite mensal atualizado. Os check-ins do mês foram preservados.'); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  return <section className="student-plan"><h3>Limite mensal de aulas</h3><FormError message={error}/>{notice && <p className="portal-notice" role="status">{notice}</p>}
    {saldo && <ResumoSaldoMensal saldo={saldo}/>}
    <form onSubmit={save}><div className="form-grid"><Field label="Participação mensal"><select disabled={busy || !saldo} value={limitado ? 'limitado' : 'ilimitado'} onChange={event => setLimitado(event.target.value === 'limitado')}><option value="ilimitado">Sem limite mensal</option><option value="limitado">Limite de aulas por mês</option></select></Field>
      {limitado && <Field label="Aulas por mês"><input required type="number" min={1} max={1000} step={1} disabled={busy || !saldo} value={limite} onChange={event => setLimite(event.target.value)}/></Field>}</div>
      <p className="helper">Mês do calendário em São Paulo. Cada novo check-in desconta uma aula; repetir o mesmo check-in não desconta novamente. O limite semanal, se configurado, também se aplica.</p>
      <div className="form-actions"><Button type="submit" disabled={busy || !saldo}>{busy ? 'Aguarde…' : 'Salvar limite mensal'}</Button></div>
    </form></section>;
}
