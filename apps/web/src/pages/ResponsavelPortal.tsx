import { useCallback, useEffect, useState } from 'react';
import { Button, Field, FormError, Empty } from '../components';
import { api } from '../lib';
import { StudentPortal } from './StudentPortal';
export function ResponsavelPortal({onLogout}:{onLogout:()=>void}){
  const [filhos,setFilhos]=useState<{id:string;nome:string;podeCheckin:boolean}[]>([]),[id,setId]=useState(''),[error,setError]=useState('');
  const load=useCallback(async()=>{try{const rows=await api<typeof filhos>('/responsavel/dependentes');setFilhos(rows);setId(atual=>rows.some(a=>a.id===atual)?atual:rows[0]?.id??'');setError('');}catch(e){setError((e as Error).message);setFilhos([]);setId('');}},[]);
  useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};window.addEventListener('focus',refresh);const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
  const filho=filhos.find(a=>a.id===id);
  return <><section className="responsavel-selector"><div><strong>Área do responsável</strong><p>Você acompanha somente os alunos vinculados ao seu acesso.</p></div><Field label="Aluno acompanhado"><select value={id} onChange={e=>setId(e.target.value)}>{filhos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></Field><FormError message={error}/></section>{filho?<StudentPortal key={id} onLogout={onLogout} apiBase={`/responsavel/${id}/portal`} responsavel podeCheckin={filho.podeCheckin}/>:<main className="portal-main"><Empty title="Nenhum dependente disponível" description="Consulte a academia. Ao completar 18 anos, o aluno precisa assumir o próprio acesso."/><Button onClick={onLogout}>Sair</Button></main>}</>;
}
