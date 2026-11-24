import { useCallback, useContext, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Aluno, MetaGraduacao, ProgressoGraduacao } from '@tatame/shared';
import { Award, Bell, RefreshCw } from 'lucide-react';
import { Belt, Button, Field, FormError, Modal } from '../components';
import { api, dateLabel, today } from '../lib';
import { SeletorGraduacao } from './SeletorGraduacao';
import { StoreContext } from '../store';
import { useGraduacoes } from '../graduacoes';

function Meta({title,meta}:{title:string;meta:MetaGraduacao}){
  return <div className={'graduacao-meta '+(meta.apto?'is-ready':'')}><strong>{title}</strong><p>{meta.aulasNecessarias===null?'Sem meta de aulas configurada':meta.aulasRestantes?`${meta.aulasRestantes===1?'Falta 1 aula confirmada':'Faltam '+meta.aulasRestantes+' aulas confirmadas'} (meta: ${meta.aulasNecessarias}).`:`Meta de ${meta.aulasNecessarias} aulas atingida.`}</p><small>{meta.apto?'Critérios atingidos · aguardando confirmação do mestre':'Aguardando os requisitos e os graus anteriores.'}</small></div>;
}
export function PendenciasGraduacao({onAbrir}:{onAbrir:(id:string)=>void}){
  const store=useContext(StoreContext);
  const [rows,setRows]=useState<{alunoId:string;nome:string;faixa:string;solicitacaoPendente:boolean}[]>([]),[error,setError]=useState('');
  useEffect(()=>{let active=true;void api<typeof rows>('/graduacoes/pendencias').then(data=>{if(active){setRows(data);setError('');}}).catch(e=>{if(active)setError((e as Error).message);});return()=>{active=false;};},[store?.revision]);
  return error?<FormError message={'Não foi possível consultar revisões de graduação: '+error}/>:rows.length?<section className="card portal-panel"><h2>Graduações para revisar · {rows.length}</h2><p className="helper">Alunos que atingiram critérios ou sinalizaram ao professor. A promoção depende da sua avaliação.</p><div className="graduacao-pedidos">{rows.map(row=><Button key={row.alunoId} variant="secondary" onClick={()=>onAbrir(row.alunoId)}><Bell size={14}/>{row.nome} · {row.faixa}{row.solicitacaoPendente?' · aluno avisou':' · critérios atingidos'}</Button>)}</div></section>:null;
}
export function GraduacaoAluno({alunoId,apiBase='/portal',onUpdated}:{alunoId?:string;apiBase?:string;onUpdated?:(aluno:Aluno)=>void}){
  const store=useContext(StoreContext),catalogo=useGraduacoes(),admin=Boolean(alunoId),base=admin?`/alunos/${alunoId}/graduacao`:apiBase+'/graduacao';
  const [data,setData]=useState<ProgressoGraduacao|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState('');
  const [ajuste,setAjuste]=useState(false),[form,setForm]=useState({versao:0,faixa:'',faixaId:'',grauId:null as string|null,grauNumero:undefined as number|undefined,dataInicioFaixa:'',aulasAnteriores:0});
  const [confirmar,setConfirmar]=useState<{tipo:'grau'|'faixa';versao:number;regraAssinatura:string;rotulo:string}|null>(null);
  const leitura=useRef(0);
  const load=useCallback(async()=>{const atual=++leitura.current;setLoading(true);try{const result=await api<ProgressoGraduacao>(base);if(atual===leitura.current){setData(result);setError('');}}catch(e){if(atual===leitura.current)setError((e as Error).message);}finally{if(atual===leitura.current)setLoading(false);}},[base]);
  useEffect(()=>{void load();},[load,store?.revision]);
  useEffect(()=>{const refresh=()=>{if(!document.hidden)void load();};const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
  const run=async(body:unknown,signal=false)=>{setBusy(true);setError('');setNotice('');try{const result=await api<ProgressoGraduacao>(base+(signal?'/solicitacao':''),{method:'POST',body:JSON.stringify(body)});leitura.current++;setLoading(false);setData(result);if(admin&&onUpdated)onUpdated(await api<Aluno>('/alunos/'+alunoId));await catalogo?.reload();if(admin)await store?.reload();setAjuste(false);setConfirmar(null);setNotice(signal?'Professor avisado. A graduação depende da revisão dele.':'Graduação registrada no histórico.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const openAjuste=()=>{if(!data)return;const faixa=catalogo?.faixas.find(f=>f.nome===data.faixa);setForm({versao:data.estado?.versao??0,faixa:data.faixa,faixaId:faixa?.id??'',grauId:faixa?.graus.find(g=>g.numero===data.grauAtual)?.id??null,grauNumero:undefined,dataInicioFaixa:data.estado?.dataInicioFaixa??'',aulasAnteriores:data.estado?.aulasAnteriores??0});setError('');setAjuste(true);};
  const saveAjuste=(e:FormEvent)=>{e.preventDefault();void run({tipo:'ajuste',versao:form.versao,faixaId:form.faixaId,grauId:form.grauId,grauNumero:form.grauNumero,dataInicioFaixa:form.dataInicioFaixa,aulasAnteriores:form.aulasAnteriores});};
  const grausRecebidos=data?.historico.filter(e=>e.tipo==='grau')??[];
  const pronto=Boolean(data?.metaGrau?.apto||data?.metaFaixa?.apto);
  return <section className="card portal-panel graduacao-aluno"><div className="portal-section-heading"><div><h2><Award size={18}/> {admin?'Evolução da graduação':'Minha trajetória'}</h2><p className="helper">Contagem por presenças confirmadas pelo professor, sem promoção automática.</p></div><Button variant="ghost" disabled={busy||loading} onClick={()=>void load()}><RefreshCw size={14}/>Atualizar</Button></div><FormError message={error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}
    {!data?<p className="helper">{loading?'Carregando evolução…':'Não foi possível carregar a evolução.'}</p>:<><div className="graduacao-resumo"><Belt value={data.faixa}/><strong>{data.grauAtual===null?'Grau ainda não informado':`${data.grauAtual} grau(s)`}</strong><span>{data.estado?`Nesta faixa desde ${dateLabel(data.estado.dataInicioFaixa)}`:'Data de início na faixa ainda não informada'}</span></div>
    {!data.estado&&<p className="portal-notice">{admin?'Defina o ponto de partida com a data real de início na faixa. Cadastros antigos não foram preenchidos automaticamente.':'O professor precisa informar o ponto de partida da sua graduação para liberar o acompanhamento.'}</p>}
    {!data.regra&&<p className="helper aula-form-note">As regras desta faixa ainda não foram configuradas pela academia.</p>}
    {data.estado&&data.grauAtual===null&&<p className="helper aula-form-note">O grau atual precisa ser informado pelo mestre. Use Sem graus quando for o ponto de partida.</p>}
    {data.estado&&<><div className="graduacao-contagem"><strong>{data.aulasTotal} aulas nesta faixa</strong><span>{data.aulasConfirmadas} confirmadas no sistema + {data.aulasAnteriores} anteriores reconhecidas pelo mestre.</span></div><div className="graduacao-metas">{data.metaGrau&&<Meta title={`Próximo objetivo: ${data.proximoGrau}º grau`} meta={data.metaGrau}/>}{data.metaFaixa&&<Meta title={`Próxima faixa: ${data.proximaFaixa}`} meta={data.metaFaixa}/>}</div></>}
    {data.solicitacaoPendente&&<p className="portal-notice" role="status">{admin?'O aluno sinalizou que atingiu os critérios e pediu revisão da graduação.':'Seu aviso ao professor está registrado. Aguarde a revisão da graduação.'}</p>}
    {admin?<div className="graduacao-actions"><Button variant="secondary" disabled={busy} onClick={openAjuste}>{data.estado?'Ajustar graduação':'Definir ponto de partida'}</Button>{data.metaGrau&&<Button disabled={busy||!data.metaGrau.apto} onClick={()=>setConfirmar({tipo:'grau',versao:data.estado!.versao,regraAssinatura:data.regraAssinatura!,rotulo:`Conceder o ${data.proximoGrau}º grau`})}>Adicionar próximo grau</Button>}{data.metaFaixa&&<Button disabled={busy||!data.metaFaixa.apto} onClick={()=>setConfirmar({tipo:'faixa',versao:data.estado!.versao,regraAssinatura:data.regraAssinatura!,rotulo:`Promover para a faixa ${data.proximaFaixa}`})}>Promover para {data.proximaFaixa}</Button>}</div>:<Button variant="secondary" disabled={busy||!pronto||data.solicitacaoPendente} onClick={()=>void run({versao:data.estado!.versao},true)}><Bell size={15}/>{data.solicitacaoPendente?'Professor avisado':'Sinalizar ao professor'}</Button>}
    <h3 className="turma-detail-label">Graus recebidos</h3>{!grausRecebidos.length?<p className="helper">Nenhum grau recebido registrado.</p>:<div className="graduacao-historico">{grausRecebidos.map(e=><article key={e.id}><strong>{e.grauNovo}º grau · {e.faixaNova}</strong><span>{new Date(e.criadoEm).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}</span></article>)}</div>}</>}

    {!!data?.historicoFaixas?.length && <details>
      <summary>Histórico de aulas por faixa</summary>
      <div className="graduacao-historico">
        {data.historicoFaixas.map(registro => <article key={registro.eventoId}>
          <strong>{registro.faixa} · {registro.aulasTotal} {registro.aulasTotal === 1 ? 'aula' : 'aulas'}</strong>
          <span>{registro.tipo === 'faixa' ? 'Antes da promoção' : 'Antes do ajuste'} em {new Date(registro.registradoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}{registro.grau === null ? '' : registro.grau === 0 ? ' · Sem graus' : ` · ${registro.grau}º grau`}</span>
          {registro.dataInicio && <span>Início na faixa em {dateLabel(registro.dataInicio)} · {registro.aulasConfirmadas} confirmadas na chamada + {registro.aulasAnteriores} anteriores</span>}
        </article>)}
      </div>
    </details>}

    {ajuste&&<Modal wide title="Registrar graduação do aluno" onClose={()=>{if(!busy)setAjuste(false);}}><form onSubmit={saveAjuste}><FormError message={error}/><p className="helper aula-form-note">Use a graduação e a data reais. A alteração será registrada automaticamente no histórico. Aulas anteriores devem ser somente as que ainda não constam na chamada do sistema.</p><fieldset className="turma-form-fields" disabled={busy}><div className="form-grid"><SeletorGraduacao faixa={form.faixa} grauId={form.grauId} grauNumero={form.grauNumero} onChange={(faixa,grauId,grauNumero)=>setForm(v=>({...v,faixa,faixaId:catalogo?.faixas.find(f=>f.nome===faixa)?.id??'',grauId,grauNumero}))}/><Field label="Data de início nesta faixa"><input required type="date" min="1900-01-01" max={today()} value={form.dataInicioFaixa} onChange={e=>setForm(v=>({...v,dataInicioFaixa:e.target.value}))}/></Field><Field label="Aulas anteriores não registradas"><input required type="number" min={0} max={100000} value={form.aulasAnteriores} onChange={e=>setForm(v=>({...v,aulasAnteriores:Number(e.target.value)}))}/></Field></div></fieldset><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={()=>setAjuste(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Salvando…':'Registrar graduação'}</Button></div></form></Modal>}
    {confirmar&&<Modal title="Confirmar graduação" onClose={()=>{if(!busy)setConfirmar(null);}}><p className="confirm-text">{confirmar.rotulo} para {data?.nome}?</p><p className="helper">A alteração será registrada no histórico. Os critérios e a versão da graduação serão conferidos novamente ao confirmar.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={()=>setConfirmar(null)}>Voltar</Button><Button disabled={busy} onClick={()=>{const {rotulo,...body}=confirmar;void run(body);}}>{busy?'Registrando…':'Confirmar promoção'}</Button></div></Modal>}
  </section>;
}
