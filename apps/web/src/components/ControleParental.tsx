import { TelefoneInput } from './TelefoneInput';
import { useCallback, useEffect, useState } from 'react';
import type { Aluno, ControleParental as Dados } from '@tatame/shared';
import { Button, Field, FormError } from '../components';
import { api } from '../lib';
import { useAcademia } from '../store';
import { Comunicados } from './Comunicados';

export function ControleParental({aluno,onUpdated}:{aluno:Aluno;onUpdated:(aluno:Aluno)=>void}){
  const {reload}=useAcademia();
  const [data,setData]=useState<Dados|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[link,setLink]=useState(''),[destinatario,setDestinatario]=useState('');
  const [responsavel,setResponsavel]=useState({nome:'',email:'',telefone:'',parentesco:''}),[celular,setCelular]=useState(aluno.possuiCelular!==false),[proprio,setProprio]=useState({email:aluno.email.endsWith('@cadastro.invalid')?'':aluno.email,telefone:aluno.telefone}),[manterContato,setManterContato]=useState(true);
  const base='/alunos/'+aluno.id;
  const load=useCallback(async()=>{const dados=await api<Dados>(base+'/familia');setData(dados);setError('');setCelular(dados.aluno.possuiCelular!==false);const r=dados.responsaveis.find(r=>r.tipoVinculo==='responsavel');if(r)setResponsavel({nome:r.nome,email:r.email,telefone:r.telefone,parentesco:r.parentesco});return dados;},[base]);
  useEffect(()=>{void load().catch(e=>setError((e as Error).message));},[load]);
  const executar=async(acao:'salvar'|'convidar'|'transferir')=>{
    setBusy(true);setError('');setLink('');
    try{
      const resultado=await api<{token?:string;email?:string}>(base+'/familia'+(acao==='salvar'?'':'/'+acao),{method:acao==='salvar'?'PUT':'POST',body:JSON.stringify(acao==='salvar'?{possuiCelular:celular,responsavel}:acao==='transferir'?{...proprio,maioridade:!data?.menor,manterContato}:{})});
      if(resultado.token){setLink(window.location.origin+'/#ativar='+resultado.token);setDestinatario(resultado.email??'');}
      const dados=await load();onUpdated(dados.aluno);await reload();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  return <><section className="student-access"><div className="portal-section-heading"><h3>Responsável e acesso</h3><Button variant="ghost" disabled={busy} onClick={()=>{void load().catch(e=>setError((e as Error).message));}}>Atualizar vínculo</Button></div><p className="helper">{!data?'Consultando vínculos de acesso…':data.menor?'O aluno pode ter acesso próprio ou usar o acesso do responsável.':'Aluno maior de idade: transfira a responsabilidade e mantenha o antigo responsável apenas como contato, se desejar.'}</p><FormError message={error}/>
    {data?.responsaveis.filter(r=>r.tipoVinculo!=='arquivado').map(r=><p key={r.id}><strong>{r.nome}</strong> · {r.parentesco} · {r.email}<br/><small>{r.tipoVinculo==='contato'?'Somente contato — sem acesso à conta do aluno':r.ativado?'Conta do responsável ativada':'Acesso aguardando ativação'}</small></p>)}
    {data?.menor&&<form onSubmit={e=>{e.preventDefault();void executar('salvar');}}><label className="checkbox-label"><input type="checkbox" checked={celular} onChange={e=>setCelular(e.target.checked)}/>O aluno possui celular próprio</label><p className="helper">Sem celular: o responsável faz o check-in. Com celular: o aluno faz o próprio check-in; o responsável acompanha informações e autorizações. Para preparar o acesso de quem passou a ter celular, use Ativar acesso próprio abaixo.</p><div className="form-grid">{([{key:'nome',label:'Nome do responsável'},{key:'email',label:'E-mail do responsável'},{key:'telefone',label:'Telefone do responsável'},{key:'parentesco',label:'Parentesco'}] as const).map(f=><Field key={f.key} label={f.label}>{f.key==='telefone'?<TelefoneInput required value={responsavel.telefone} onValueChange={telefone=>setResponsavel(v=>({...v,telefone}))}/>:<input required type={f.key==='email'?'email':'text'} value={responsavel[f.key]} onChange={e=>setResponsavel(v=>({...v,[f.key]:e.target.value}))}/>}</Field>)}</div><div className="form-actions"><Button variant="secondary" type="submit" disabled={busy}>Salvar responsável e acesso</Button><Button disabled={busy||!data.responsaveis.some(r=>r.tipoVinculo==='responsavel')} onClick={()=>void executar('convidar')}>Gerar acesso do responsável</Button></div></form>}
    {data&&<form onSubmit={e=>{e.preventDefault();void executar('transferir');}}><h4>{data.menor?'Ativar acesso próprio do aluno':'Transferir responsabilidade ao aluno'}</h4><p className="helper">Use o e-mail e telefone do próprio aluno. O acesso anterior dele será encerrado, e um convite permitirá escolher a senha novamente. Dados e histórico permanecem no mesmo cadastro.</p><div className="form-grid"><Field label="E-mail próprio do aluno"><input required type="email" value={proprio.email} onChange={e=>setProprio(v=>({...v,email:e.target.value}))}/></Field><Field label="Telefone próprio do aluno"><TelefoneInput required value={proprio.telefone} onValueChange={telefone=>setProprio(v=>({...v,telefone}))}/></Field></div>{!data.menor&&<label className="checkbox-label"><input type="checkbox" checked={manterContato} onChange={e=>setManterContato(e.target.checked)}/>Manter responsável anterior apenas como contato</label>}<Button variant="secondary" type="submit" disabled={busy||data.aluno.situacao!=='ativo'}>{data.menor?'Ativar acesso próprio':'Confirmar transferência por maioridade'}</Button></form>}
    {link&&<div className="student-access-link"><p>Convite privado para <strong>{destinatario}</strong>. Válido por 24 horas. Copie e entregue somente à pessoa correspondente.</p><input aria-label="Convite de acesso familiar" readOnly value={link} onFocus={e=>e.currentTarget.select()}/><Button variant="secondary" onClick={()=>{void navigator.clipboard.writeText(link).catch(()=>setError('Selecione e copie o convite manualmente.'));}}>Copiar convite</Button></div>}
    {!!data?.eventos.length&&<details><summary>Histórico de alterações de acesso</summary>{data.eventos.map(e=><p key={e.id}>{new Date(e.criadoEm).toLocaleString('pt-BR')} · {e.tipo.replaceAll('_',' ')}</p>)}</details>}
  </section><Comunicados base={base} admin/></>;
}
