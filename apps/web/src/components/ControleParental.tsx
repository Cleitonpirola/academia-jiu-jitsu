import { TelefoneInput } from './TelefoneInput';
import { useCallback, useEffect, useState } from 'react';
import type { Aluno, ControleParental as Dados } from '@tatame/shared';
import { Button, Field, FormError } from '../components';
import { api, today } from '../lib';
import { useAcademia } from '../store';

export function ControleParental({aluno,onUpdated}:{aluno:Aluno;onUpdated:(aluno:Aluno)=>void}){
  const {reload}=useAcademia();
  const [data,setData]=useState<Dados|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[link,setLink]=useState(''),[destinatario,setDestinatario]=useState('');
  const [responsavel,setResponsavel]=useState({nome:'',email:'',telefone:'',parentesco:''});
  const [celular,setCelular]=useState(aluno.possuiCelular!==false);
  const [proprio,setProprio]=useState({email:aluno.email.endsWith('@cadastro.invalid')?'':aluno.email,telefone:aluno.telefone});
  const base='/alunos/'+aluno.id;
  const menor=Boolean(aluno.dataNascimento&&today()<String(Number(aluno.dataNascimento.slice(0,4))+18)+aluno.dataNascimento.slice(4));
  const ativarProprio=Boolean(celular&&data&&(data.aluno.acessoPrincipal==='responsavel'||data.aluno.email.endsWith('@cadastro.invalid')));
  const vinculoResponsavel=data?.responsaveis.find(r=>r.tipoVinculo==='responsavel');
  const load=useCallback(async()=>{
    const dados=await api<Dados>(base+'/familia');setData(dados);setError('');setCelular(dados.aluno.possuiCelular!==false);
    const r=dados.responsaveis.find(r=>r.tipoVinculo==='responsavel')??dados.responsaveis.find(r=>r.tipoVinculo==='contato');
    if(r)setResponsavel({nome:r.nome,email:r.email,telefone:r.telefone,parentesco:r.parentesco});
    return dados;
  },[base]);
  useEffect(()=>{if(menor)void load().catch(e=>setError((e as Error).message));},[load,menor]);
  const executar=async(acao:'salvar'|'convidar'|'transferir')=>{
    setBusy(true);setError('');setLink('');
    try{
      const body=acao==='salvar'?(celular?{possuiCelular:true}:{possuiCelular:false,responsavel}):acao==='transferir'?{...proprio,maioridade:false,manterContato:true}:{};
      const resultado=await api<{token?:string;email?:string}>(base+'/familia'+(acao==='salvar'?'':'/'+acao),{method:acao==='salvar'?'PUT':'POST',body:JSON.stringify(body)});
      if(resultado.token){setLink(window.location.origin+'/#ativar='+resultado.token);setDestinatario(resultado.email??'');}
      const dados=await load();onUpdated(dados.aluno);await reload();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  if(!menor||data?.menor===false)return null;
  return <section className="student-access">
    <div className="portal-section-heading"><h3>{celular?'Acesso do aluno':'Responsável e acesso'}</h3><Button variant="ghost" disabled={busy} onClick={()=>{void load().catch(e=>setError((e as Error).message));}}>Atualizar acesso</Button></div>
    <FormError message={error}/>
    {!data?<p className="helper">Consultando acesso…</p>:<form onSubmit={e=>{e.preventDefault();void executar(ativarProprio?'transferir':'salvar');}}>
      <label className="checkbox-label"><input type="checkbox" disabled={busy} checked={celular} onChange={e=>{setCelular(e.target.checked);setLink('');}}/>Possui celular</label>
      <p className="helper">{celular?'O aluno usa a própria conta para acompanhar aulas e fazer check-in.':'O responsável administra as aulas e faz o check-in pelo aluno.'}</p>
      {!celular&&<div className="form-grid">{([{key:'nome',label:'Nome do responsável'},{key:'email',label:'E-mail do responsável'},{key:'telefone',label:'Telefone do responsável'},{key:'parentesco',label:'Parentesco'}] as const).map(f=><Field key={f.key} label={f.label}>{f.key==='telefone'?<TelefoneInput required value={responsavel.telefone} onValueChange={telefone=>setResponsavel(v=>({...v,telefone}))}/>:<input required type={f.key==='email'?'email':'text'} value={responsavel[f.key]} onChange={e=>setResponsavel(v=>({...v,[f.key]:e.target.value}))}/>}</Field>)}</div>}
      {ativarProprio&&<><p className="helper">Informe os contatos do aluno para gerar o convite de acesso próprio. O histórico será preservado.</p><div className="form-grid"><Field label="E-mail próprio do aluno"><input required type="email" value={proprio.email} onChange={e=>setProprio(v=>({...v,email:e.target.value}))}/></Field><Field label="Telefone próprio do aluno"><TelefoneInput required value={proprio.telefone} onValueChange={telefone=>setProprio(v=>({...v,telefone}))}/></Field></div></>}
      <div className="form-actions"><Button variant="secondary" type="submit" disabled={busy||data.aluno.situacao!=='ativo'}>{ativarProprio?'Ativar acesso próprio':celular?'Salvar acesso':'Salvar responsável e acesso'}</Button>{!celular&&vinculoResponsavel&&!vinculoResponsavel.ativado&&<Button disabled={busy||data.aluno.situacao!=='ativo'} onClick={()=>void executar('convidar')}>Gerar convite do responsável</Button>}</div>
    </form>}
    {link&&<div className="student-access-link"><p>Convite privado para <strong>{destinatario}</strong>. Válido por 24 horas. Copie e entregue somente à pessoa correspondente.</p><input aria-label="Convite de acesso familiar" readOnly value={link} onFocus={e=>e.currentTarget.select()}/><Button variant="secondary" onClick={()=>{void navigator.clipboard.writeText(link).catch(()=>setError('Selecione e copie o convite manualmente.'));}}>Copiar convite</Button></div>}
    {!!data?.eventos.length&&<details><summary>Histórico de alterações de acesso</summary>{data.eventos.map(e=><p key={e.id}>{new Date(e.criadoEm).toLocaleString('pt-BR')} · {e.tipo.replaceAll('_',' ')}</p>)}</details>}
  </section>;
}
