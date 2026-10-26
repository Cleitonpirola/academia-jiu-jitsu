import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import type { Aluno, GestaoPlano } from '@tatame/shared';
import { Button, Field, FormError } from '../components';
import { api, dateLabel } from '../lib';
import { ResumoPlano } from './ResumoPlano';

export function PlanoAlunoEditor({ aluno }: { aluno: Aluno }) {
  const [data, setData] = useState<GestaoPlano | null>(null);
  const [nome, setNome] = useState('Ilimitado');
  const [tipo, setTipo] = useState('ilimitado');
  const [limite, setLimite] = useState('3');
  const [aulaId, setAulaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (reset = false, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const result = await api<GestaoPlano>(`/alunos/${aluno.id}/plano`, { signal });
      if (signal?.aborted) return;
      setData(result);
      if (reset) { setNome(result.uso.nome); setTipo(result.uso.limiteSemanal === null ? 'ilimitado' : 'limitado'); setLimite(String(result.uso.limiteSemanal ?? 3)); }
      return result;
    } catch (error) { if (!signal?.aborted) { setData(null); setError((error as Error).message); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [aluno.id]);
  useEffect(() => { const controller = new AbortController(); void load(true, controller.signal); return () => controller.abort(); }, [load]);
  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); const result = await load(); if (result) setNotice(message); }
    catch (error) { setError((error as Error).message); await load(); }
    finally { setBusy(false); }
  };
  const save = (event: FormEvent) => { event.preventDefault(); void run(() => api(`/alunos/${aluno.id}/plano`, { method: 'PUT', body: JSON.stringify({ nome, limiteSemanal: tipo === 'ilimitado' ? null : Number(limite) }) }), 'Plano atualizado. O uso da semana foi preservado.'); };
  const liberar = (event: FormEvent) => { event.preventDefault(); void run(async () => { await api(`/alunos/${aluno.id}/liberacoes/${aulaId}`, { method: 'PUT', body: JSON.stringify({ motivo }) }); setAulaId(''); setMotivo(''); }, 'Aula extra autorizada. Nenhuma cobrança foi gerada.'); };
  const disabled = busy || loading;
  return <section className="student-plan"><div className="portal-section-heading"><div><h3>Plano de treino</h3><p className="helper">Configure o acesso deste aluno às aulas.</p></div><Button variant="ghost" aria-label="Atualizar uso do plano" disabled={disabled} onClick={() => { setError(''); void load(); }}><RefreshCw size={16}/></Button></div>
    <FormError message={error}/>{notice && <p className="portal-notice" role="status">{notice}</p>}
    {data ? <><ResumoPlano uso={data.uso}/><form onSubmit={save}><div className="form-grid"><Field label="Nome do plano" full><input required minLength={2} maxLength={80} value={nome} disabled={disabled} onChange={event => setNome(event.target.value)} placeholder="Ex.: Essencial · 3 aulas"/></Field><Field label="Participação"><select value={tipo} disabled={disabled} onChange={event => setTipo(event.target.value)}><option value="ilimitado">Sem limite semanal</option><option value="limitado">Limite semanal</option></select></Field>{tipo === 'limitado' && <Field label="Aulas por semana"><input type="number" required min={1} max={100} step={1} disabled={disabled} value={limite} onChange={event => setLimite(event.target.value)}/></Field>}</div><p className="helper">Segunda a domingo. Alterar o plano recalcula a semana atual e mantém os treinos já registrados. Mensalidades são administradas separadamente.</p><div className="form-actions"><Button type="submit" disabled={disabled}>Salvar plano</Button></div></form>
      <div className="plan-extra"><h3><ShieldCheck size={18}/>Autorizar aula extra</h3><p className="helper">Quando a cota terminar, libere uma aula do dia para este aluno. A autorização não quita mensalidades e não gera cobrança.</p>{data.uso.limiteAtingido && aluno.situacao === 'ativo' ? <form onSubmit={liberar}><Field label="Aula de hoje"><select required value={aulaId} disabled={disabled} onChange={event => setAulaId(event.target.value)}><option value="">Selecione a aula</option>{data.aulasHoje.filter(aula => !data.liberacoes.some(item => item.aulaId === aula.id)).map(aula => <option key={aula.id} value={aula.id}>{aula.horaInicio} · {aula.titulo}</option>)}</select></Field><Field label="Motivo da liberação"><input required minLength={3} maxLength={240} value={motivo} disabled={disabled} onChange={event => setMotivo(event.target.value)} placeholder="Ex.: Reposição autorizada pela academia"/></Field><Button type="submit" disabled={disabled || !aulaId}><ShieldCheck size={16}/>Autorizar esta aula</Button></form> : <p className="helper">{aluno.situacao !== 'ativo' ? 'Reative o cadastro para autorizar aulas.' : 'A liberação fica disponível quando o aluno atinge o limite semanal.'}</p>}
      {data.liberacoes.length > 0 && <div className="plan-release-list">{data.liberacoes.map(item => <div key={item.id}><div><strong>{item.aula.titulo} · {item.aula.horaInicio}</strong><small>{dateLabel(item.aula.dataAula)} · {item.aula.situacao === 'cancelada' ? 'Aula cancelada' : item.utilizada ? 'Com check-in ou chamada' : 'Autorização disponível'}</small><p>{item.motivo}</p></div><Button variant="ghost" disabled={disabled || item.utilizada} onClick={() => void run(() => api(`/alunos/${aluno.id}/liberacoes/${item.aulaId}`, { method: 'DELETE' }), 'Autorização revogada.')}>Revogar</Button></div>)}</div>}
      </div></> : <p className="helper">{loading ? 'Consultando plano e uso…' : 'Use o botão de atualizar para consultar o plano novamente.'}</p>}
  </section>;
}
