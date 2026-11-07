import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import type {LoteComunicadoView} from '@tatame/shared';
import {Button,Field,FormError} from '../components';
import {api,dateLabel} from '../lib';
import {ExcluirComunicado} from './ExcluirComunicado';
type Preview={alunosAtivos:number;destinatarios:{alunoId:string;nome:string}[];naoEnviados:{nome:string;motivo:string}[]};

export function ComunicadoEquipe(){
 const [preview,setPreview]=useState<Preview|null>(null),[lotes,setLotes]=useState<LoteComunicadoView[]>([]),[titulo,setTitulo]=useState(''),[mensagem,setMensagem]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const envio=useRef(crypto.randomUUID());
 const load=useCallback(async()=>{try{const [p,l]=await Promise.all([api<Preview>('/comunicados/destinatarios'),api<LoteComunicadoView[]>('/comunicados/lotes')]);setPreview(p);setLotes(l.filter(lote=>lote.tipo==='aviso'));setError('');}catch(e){setError((e as Error).message);}},[]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer);},[load]);
 const changed=()=>{envio.current=crypto.randomUUID();setNotice('');};
 const send=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{await api('/comunicados/lotes',{method:'POST',body:JSON.stringify({id:envio.current,tipo:'aviso',titulo,mensagem})});setTitulo('');setMensagem('');envio.current=crypto.randomUUID();setNotice('Comunicado enviado. Acompanhe as confirmações abaixo.');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <section className="card portal-panel"><div className="portal-section-heading"><h2>Todos da equipe</h2><Button variant="ghost" onClick={()=>void load()}>Atualizar confirmações</Button></div><p className="helper">Uma mensagem para todos os alunos ativos. Quando o acesso principal for do responsável, ele receberá pelo aluno.</p><FormError message={error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}
 {preview&&<p><strong>{preview.destinatarios.length}</strong> aluno(s) com acesso para receber.{preview.naoEnviados.length>0&&<span> {preview.naoEnviados.length} sem acesso preparado.</span>}</p>}
 {preview?.naoEnviados.length? <details><summary>Cadastros que precisam de atenção</summary>{preview.naoEnviados.map((p,i)=><p key={i}>{p.nome} · {p.motivo}</p>)}</details>:null}
 <form onSubmit={send}><fieldset disabled={busy} className="turma-form-fields"><div className="form-grid"><Field full label="Título"><input required minLength={2} maxLength={120} value={titulo} onChange={e=>{setTitulo(e.target.value);changed();}}/></Field><Field full label="Mensagem"><textarea required minLength={2} maxLength={3000} rows={4} value={mensagem} onChange={e=>{setMensagem(e.target.value);changed();}}/></Field></div><Button disabled={!preview?.destinatarios.length} type="submit">{busy?'Enviando…':'Enviar para toda a equipe'}</Button></fieldset></form>
 <h3>Comunicados da equipe</h3>{!lotes.length&&<p className="helper">Os envios e as confirmações aparecerão aqui.</p>}{lotes.map(l=><article className="comunicado-item" key={l.id}>
   <h3>{l.titulo}</h3><p style={{whiteSpace:'pre-wrap'}}>{l.mensagem}</p>
   <small>{dateLabel(l.criadoEm.slice(0,10))} · {l.entregas.length} destinatários · {l.entregas.filter(e=>e.resposta).length} confirmações</small>
   <details><summary>Ver confirmações individuais</summary>{l.entregas.map(e=><p key={e.id}><strong>{e.nome}</strong> · {e.resposta?'Ciente':'Aguardando confirmação'}</p>)}{l.naoEnviados.map(e=><p key={e.alunoId}>{e.nome} · Não enviado: {e.motivo}</p>)}</details>
   <div className="form-actions"><ExcluirComunicado titulo={l.titulo} path={`/comunicados/lotes/${l.id}`} equipe onExcluded={() => setLotes(current => current.filter(item => item.id !== l.id))}/></div>
 </article>)}</section>;
}
