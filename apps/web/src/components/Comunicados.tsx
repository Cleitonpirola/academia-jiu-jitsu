import { useCallback, useEffect, useState } from 'react';
import type { ComunicadoAluno } from '@tatame/shared';
import { Button, Empty, Field, FormError } from '../components';
import { api } from '../lib';
import { ExcluirComunicado } from './ExcluirComunicado';

const dataComunicado = new Intl.DateTimeFormat('pt-BR', { timeZone:'America/Sao_Paulo', dateStyle:'short' });

export function Comunicados({base,admin=false}:{base:string;admin?:boolean}){
  const [rows,setRows]=useState<ComunicadoAluno[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [form,setForm]=useState({destino:'principal',titulo:'',mensagem:''});
  const load=useCallback(async()=>{try{const comunicados=await api<ComunicadoAluno[]>(base+'/comunicados');setRows(comunicados.filter(c=>c.tipo==='aviso'));setError('');}catch(e){setError((e as Error).message);}},[base]);
  useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};window.addEventListener('focus',refresh);const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
  const enviar=async()=>{setBusy(true);setError('');try{await api(base+'/comunicados',{method:'POST',body:JSON.stringify({...form,tipo:'aviso'})});setForm(v=>({...v,titulo:'',mensagem:''}));await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const confirmar=async(id:string)=>{setBusy(true);try{await api(base+`/comunicados/${id}/resposta`,{method:'PUT',body:JSON.stringify({resposta:'ciente'})});await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <section className="student-access">
    <div className="portal-section-heading"><h3>Comunicados</h3><Button variant="ghost" disabled={busy} onClick={()=>void load()}>Atualizar comunicados</Button></div>
    <p className="helper">Mensagens da academia com confirmação de leitura.</p>
    <FormError message={error}/>
    {admin && <form onSubmit={e=>{e.preventDefault();void enviar();}} className="form-grid">
      <Field label="Destinatário"><select value={form.destino} onChange={e=>setForm(v=>({...v,destino:e.target.value}))}><option value="principal">Acesso principal do aluno</option><option value="responsavel">Responsável vinculado</option></select></Field>
      <Field label="Título" full><input required minLength={2} maxLength={120} value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))}/></Field>
      <Field label="Mensagem" full><textarea required minLength={2} maxLength={3000} value={form.mensagem} onChange={e=>setForm(v=>({...v,mensagem:e.target.value}))}/></Field>
      <Button type="submit" disabled={busy}>Enviar comunicado</Button>
    </form>}
    <div className="portal-history">{rows.map(c=><article className="card portal-panel" key={c.id}>
      <h4>{c.titulo}</h4>
      <small>{dataComunicado.format(new Date(c.criadoEm))}</small>
      <p style={{whiteSpace:'pre-wrap'}}>{c.mensagem}</p>
      <p className="helper">{c.resposta ? 'Ciente' : 'Aguardando confirmação'}</p>
      {admin && <div className="form-actions"><ExcluirComunicado titulo={c.titulo} path={`${base}/comunicados/${c.id}`} onExcluded={() => setRows(current => current.filter(item => item.id !== c.id))}/></div>}
      {!admin && !c.resposta && <div className="form-actions"><Button disabled={busy} onClick={()=>void confirmar(c.id)}>Estou ciente</Button></div>}
    </article>)}</div>
    {!rows.length && <Empty title="Nenhum comunicado" description="As mensagens enviadas pela academia aparecerão aqui."/>}
  </section>;
}
