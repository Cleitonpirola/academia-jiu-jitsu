import {ComunicadoEquipe} from '../components/ComunicadoEquipe';
import { useState } from 'react';
import { Empty, Field } from '../components';
import { Comunicados } from '../components/Comunicados';
import { useAcademia } from '../store';

export function ComunicadosPage(){
  const {alunos}=useAcademia(),[alunoId,setAlunoId]=useState('equipe');
  const aluno=alunos.find(a=>a.id===alunoId);
  return <><div className="page-heading"><div><div className="eyebrow">CONVERSA COM A ACADEMIA</div><h1>Comunicados<span className="heading-dot">.</span></h1><p>Envie comunicados e acompanhe as confirmações de leitura.</p></div></div><section className="card portal-panel"><Field label="Destinatários"><select value={alunoId} onChange={e=>setAlunoId(e.target.value)}><option value="equipe">Todos da equipe</option>{[...alunos].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(a=><option key={a.id} value={a.id}>{a.nome}{a.situacao==='inativo'?' · Inativo':''}</option>)}</select></Field></section>{alunoId==='equipe'?<ComunicadoEquipe/>:aluno?<section className="card portal-panel"><h2>{aluno.nome}</h2><Comunicados key={aluno.id} base={'/alunos/'+aluno.id} admin/></section>:<Empty title={alunos.length?'Escolha o aluno para enviar um comunicado':'Cadastre um aluno primeiro'} description={alunos.length?'Você poderá direcionar a mensagem ao aluno ou ao responsável vinculado.':'Os destinatários aparecerão aqui depois do cadastro.'}/>}</>;
}
