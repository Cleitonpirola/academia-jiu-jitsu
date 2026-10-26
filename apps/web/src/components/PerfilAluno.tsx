import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Aluno, PerfilBasicoAluno } from '@tatame/shared';
import { Belt, Button, Field, FormError, Person } from '../components';
import { api, dateLabel } from '../lib';

export function PerfilAluno({onSaved}:{onSaved:()=>Promise<unknown>}){
  const [aluno,setAluno]=useState<Aluno|null>(null),[form,setForm]=useState<PerfilBasicoAluno>({nome:'',telefone:'',email:''});
  const [loading,setLoading]=useState(true);
  const [editando,setEditando]=useState(false),[senhaAtual,setSenhaAtual]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{setAluno(await api<Aluno>('/portal/perfil'));}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const emailMudou=Boolean(aluno&&form.email.trim().toLowerCase()!==aluno.email.toLowerCase());
  const editar=()=>{if(!aluno)return;setForm({nome:aluno.nome,telefone:aluno.telefone,email:aluno.email});setSenhaAtual('');setError('');setNotice('');setEditando(true);};
  const salvar=async(event:FormEvent)=>{
    event.preventDefault();setBusy(true);setError('');setNotice('');
    try{
      const result=await api<Aluno>('/portal/perfil',{method:'PUT',body:JSON.stringify({...form,...(emailMudou?{senhaAtual}:{})})});
      setAluno(result);setEditando(false);setNotice(emailMudou?'Dados salvos. No próximo login, use o novo e-mail com a mesma senha. As outras sessões foram encerradas.':'Seus dados foram atualizados.');
      await onSaved();
    }catch(e){setError((e as Error).message);}finally{setSenhaAtual('');setBusy(false);}
  };
  return <section className="card portal-panel"><div className="portal-section-heading"><div><h2>Meu perfil</h2><p className="helper">Mantenha seu nome e seus contatos atualizados.</p></div>{!editando&&aluno&&<Button variant="secondary" onClick={editar}>Editar meus dados</Button>}</div><FormError message={error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}
    {!aluno?<><p>{loading?'Carregando seu perfil…':'Não foi possível carregar seu perfil.'}</p><Button variant="secondary" disabled={loading} onClick={()=>void load()}>Atualizar perfil</Button></>:editando?<form onSubmit={salvar}><fieldset className="turma-form-fields" disabled={busy}><div className="form-grid"><Field label="Nome completo" full><input required minLength={2} maxLength={120} autoComplete="name" value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))}/></Field><Field label="Telefone"><input required type="tel" maxLength={40} autoComplete="tel" value={form.telefone} onChange={e=>setForm(v=>({...v,telefone:e.target.value}))}/></Field><Field label="E-mail de acesso"><input required type="email" maxLength={180} autoComplete="username" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></Field></div>{emailMudou&&<><p className="helper">Este será seu novo e-mail de login. Confirme sua senha atual para salvar a troca.</p><Field label="Senha atual"><input required type="password" maxLength={128} autoComplete="current-password" value={senhaAtual} onChange={e=>setSenhaAtual(e.target.value)}/></Field></>}</fieldset><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={()=>{setEditando(false);setSenhaAtual('');setError('');}}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Salvando…':'Salvar meus dados'}</Button></div></form>:<><Person name={aluno.nome} secondary={aluno.email}/><dl className="detail-grid"><div><dt>Telefone</dt><dd>{aluno.telefone}</dd></div><div><dt>E-mail de acesso</dt><dd>{aluno.email}</dd></div><div><dt>Nascimento</dt><dd>{dateLabel(aluno.dataNascimento)}</dd></div><div><dt>Matrícula</dt><dd>{dateLabel(aluno.dataMatricula)}</dd></div><div><dt>Faixa</dt><dd><Belt value={aluno.faixa} grauId={aluno.grauId}/></dd></div></dl><p className="helper">Faixa, matrícula e outros dados da academia são atualizados pelo professor ou administrador.</p></>}
  </section>;
}
