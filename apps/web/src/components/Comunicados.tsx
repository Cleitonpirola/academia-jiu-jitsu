import { useState } from 'react';
import { Button, Empty, Field, FormError } from '../components';
import { api } from '../lib';
import { ExcluirComunicado } from './ExcluirComunicado';
import { useComunicados, type CaixaComunicados } from '../use-comunicados';

const dataComunicado = new Intl.DateTimeFormat('pt-BR', { timeZone:'America/Sao_Paulo', dateStyle:'short', timeStyle:'short' });

export function Comunicados({base,admin=false,somenteConsulta=false,caixa}:{base:string;admin?:boolean;somenteConsulta?:boolean;caixa?:CaixaComunicados}){
  const local = useComunicados(base, !caixa);
  const comunicados = caixa ?? local;
  const [error,setError]=useState(''),[enviando,setEnviando]=useState(false);
  const busy = enviando || comunicados.busy;
  const rows = [...comunicados.rows].sort((a, b) => Number(Boolean(a.resposta)) - Number(Boolean(b.resposta)) || b.criadoEm.localeCompare(a.criadoEm));
  const confirmados = rows.filter(c => c.resposta === 'ciente').length;
  const resumo = `${rows.length} enviado(s) · ${confirmados} com leitura confirmada · ${rows.length-confirmados} sem confirmação`;
  const [form,setForm]=useState({destino:'principal',titulo:'',mensagem:''});
  const enviar=async()=>{setEnviando(true);setError('');try{await api(base+'/comunicados',{method:'POST',body:JSON.stringify({...form,tipo:'aviso'})});setForm(v=>({...v,titulo:'',mensagem:''}));await comunicados.load();}catch(e){setError((e as Error).message);}finally{setEnviando(false);}};
  const conteudo = <section className={somenteConsulta?'comunicados-conteudo':'student-access'}>
    <div className="portal-section-heading">{!somenteConsulta && <h3>Comunicados</h3>}<Button variant="ghost" disabled={busy} onClick={()=>void comunicados.load()}>Atualizar comunicados</Button></div>
    <p className="helper">{admin?'Leitura confirmada significa que a conta destinatária marcou Estou ciente. Sem confirmação não significa que a pessoa não abriu o recado.':'Histórico de recados enviados e confirmados. Os recados continuam aqui depois da confirmação de leitura.'}</p>
    {admin && !somenteConsulta && comunicados.loaded && <p className="helper">{resumo}</p>}
    <FormError message={error || comunicados.error}/>
    {admin && !somenteConsulta && <form onSubmit={e=>{e.preventDefault();void enviar();}} className="form-grid">
      <Field label="Destinatário"><select value={form.destino} onChange={e=>setForm(v=>({...v,destino:e.target.value}))}><option value="principal">Acesso principal do aluno</option><option value="responsavel">Responsável vinculado</option></select></Field>
      <Field label="Título" full><input required minLength={2} maxLength={120} value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))}/></Field>
      <Field label="Mensagem" full><textarea required minLength={2} maxLength={3000} value={form.mensagem} onChange={e=>setForm(v=>({...v,mensagem:e.target.value}))}/></Field>
      <Button type="submit" disabled={busy}>Enviar comunicado</Button>
    </form>}
    <div className={somenteConsulta?'comunicados-lista':'portal-history'}>{rows.map(c=>{
      const detalhes = <>
      <small>Enviado em {dataComunicado.format(new Date(c.criadoEm))}</small>
      {admin && <p className="helper">Destinatário: {c.destinatario ? `${c.destinatario.nome} · ${c.destinatario.perfil==='responsavel'?'Responsável':c.destinatario.perfil==='aluno'?'Aluno':'Administrador'}` : 'Conta destinatária não identificada'}</p>}
      <p style={{whiteSpace:'pre-wrap'}}>{c.mensagem}</p>
      <p className={`comunicado-status ${c.resposta?'confirmado':'pendente'}`}>{c.resposta ? `${admin?'Leitura confirmada · Estou ciente':'Ciente'}${c.respondidoEm ? ` em ${dataComunicado.format(new Date(c.respondidoEm))}` : ''}` : admin?'Sem confirmação de leitura':'Aguardando confirmação de leitura'}</p>
      {admin && !somenteConsulta && <div className="form-actions"><ExcluirComunicado titulo={c.titulo} path={`${base}/comunicados/${c.id}`} onExcluded={() => void comunicados.load()}/></div>}
      {!admin && !somenteConsulta && !c.resposta && <div className="form-actions"><Button disabled={busy} onClick={()=>void comunicados.confirmar(c.id)}>Estou ciente</Button></div>}
      </>;
      return somenteConsulta ? <details className={`comunicado-resumo${c.resposta ? '' : ' comunicado-pendente'}`} key={c.id}>
        <summary><span className="comunicado-titulo">{c.titulo}</span><span className={`comunicado-status ${c.resposta?'confirmado':'pendente'}`}>{c.resposta?'Leitura confirmada':'Sem confirmação'}</span></summary>
        <div className="comunicado-detalhes">{detalhes}</div>
      </details> : <article className={`card portal-panel${c.resposta ? '' : ' comunicado-pendente'}`} key={c.id}><h4>{c.titulo}</h4>{detalhes}</article>;
    })}</div>
    {!comunicados.loaded && !comunicados.error && <p className="helper">Carregando comunicados…</p>}
    {comunicados.loaded && !rows.length && !comunicados.error && <Empty title="Nenhum comunicado" description="As mensagens enviadas pela academia aparecerão aqui."/>}
  </section>;
  return somenteConsulta ? <details className="student-access comunicados-historico">
    <summary><strong>Histórico de comunicados</strong><span className="helper">{comunicados.loaded ? resumo : comunicados.error ? 'Consulta indisponível' : 'Carregando comunicados…'}</span>{comunicados.error && comunicados.loaded && <span className="helper">Falha ao atualizar. Abra para tentar novamente.</span>}</summary>
    {conteudo}
  </details> : conteudo;
}
