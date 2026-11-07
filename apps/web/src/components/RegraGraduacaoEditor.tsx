import { useEffect, useState, type FormEvent } from 'react';
import type { FaixaGraduacaoView, RegraGraduacao } from '@tatame/shared';
import { Button, Field, FormError } from '../components';
import { api } from '../lib';
import { useGraduacoes } from '../graduacoes';

export function RegraGraduacaoEditor({faixa}:{faixa:FaixaGraduacaoView}){
  const catalogo=useGraduacoes();
  const [aulas,setAulas]=useState<number|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{let active=true;setLoading(true);void api<RegraGraduacao[]>('/graduacoes/regras').then(rows=>{if(active){setAulas(rows.find(r=>r.faixaId===faixa.id)?.aulasPorGrau??null);setError('');setNotice('');}}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[faixa.id]);
  const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');try{await api(`/graduacoes/faixas/${faixa.id}/regra`,{method:'PUT',body:JSON.stringify({aulasPorGrau:aulas})});await catalogo?.reload();setNotice('Quantidade de aulas salva. Os graus são adicionados no perfil do aluno pelo professor.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <section className="graduacao-regras"><FormError message={error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}{loading?<p className="helper">Carregando quantidade de aulas…</p>:<form onSubmit={save}><fieldset className="turma-form-fields" disabled={busy||faixa.situacao!=='ativo'}><Field label="Aulas confirmadas por grau"><input type="number" min={1} max={100000} value={aulas??''} placeholder="Ex.: 30" onChange={e=>setAulas(e.target.value?Number(e.target.value):null)}/></Field><p className="helper aula-form-note">O professor adiciona o próximo grau no perfil do aluno, após conferir as presenças.</p></fieldset><div className="form-actions"><Button type="submit" disabled={busy||faixa.situacao!=='ativo'}>{busy?'Salvando…':'Salvar'}</Button></div></form>}</section>;
}
