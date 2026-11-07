import {useCallback,useEffect,useState} from 'react';
import {Video,Plus,LockKeyhole,ExternalLink} from 'lucide-react';
import type {GestaoTecnicas,VideoTecnica,BibliotecaTecnicas} from '@tatame/shared';
import {Button,Field,FormError,Empty,Modal} from '../components';
import {api,money,today,dateLabel} from '../lib';

export function TecnicasPage(){
 const [data,setData]=useState<GestaoTecnicas|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[edit,setEdit]=useState<VideoTecnica|null|undefined>(undefined);
 const [ativa,setAtiva]=useState(false),[preco,setPreco]=useState('10,00'),[instrucoes,setInstrucoes]=useState(''),[aluno,setAluno]=useState(''),[validade,setValidade]=useState(today());
 const load=useCallback(async(signal?:AbortSignal)=>{const v=await api<GestaoTecnicas>('/tecnicas',{signal});setData(v);return v;},[]);
 useEffect(()=>{const abort=new AbortController();void load(abort.signal).then(v=>{setAtiva(v.config.ativa);setPreco((v.config.valorMensalCentavos/100).toFixed(2).replace('.',','));setInstrucoes(v.config.instrucoes);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});return()=>abort.abort();},[load]);
 const executar=async(action:()=>Promise<unknown>,msg:string)=>{setBusy(true);setError('');setNotice('');try{await action();await load();setNotice(msg);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const salvarConfig=()=>{
  if(!/^\d{1,5}([,.]\d{1,2})?$/.test(preco)){setError('Informe um valor mensal, como 10,00.');return;}
  void executar(()=>api('/tecnicas/configuracao',{method:'PUT',body:JSON.stringify({ativa,valorMensalCentavos:Math.round(Number(preco.replace(',','.'))*100),instrucoes})}),'Configuração salva.');
 };
 return <><div className="page-heading"><div><div className="eyebrow">CONTEÚDO DA ACADEMIA</div><h1>Técnicas da semana</h1><p>Explicações para continuar aprendendo fora do tatame.</p></div><Button onClick={()=>setEdit(null)}><Plus size={18}/>Novo vídeo</Button></div><FormError message={error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}
 {!data?<Empty title="Carregando a biblioteca" description="Buscando vídeos e acessos." action={<Button onClick={()=>void executar(()=>load(),'Biblioteca atualizada.')}>Tentar novamente</Button>}/>:<>
 <details className="card tecnicas-settings"><summary>Configurar acesso e mensalidade opcional</summary><div className="form-grid"><label className="tecnicas-check"><input type="checkbox" checked={ativa} onChange={e=>setAtiva(e.target.checked)}/>Disponibilizar biblioteca para alunos</label><Field label="Valor mensal (R$)"><input inputMode="decimal" value={preco} onChange={e=>setPreco(e.target.value)}/></Field><Field label="Como contratar / instruções de pagamento"><textarea rows={3} maxLength={2000} value={instrucoes} onChange={e=>setInstrucoes(e.target.value)}/></Field></div><Button disabled={busy} onClick={salvarConfig}>Salvar configuração</Button><p className="helper">Contratação opcional. Confira o pagamento antes de liberar o acesso abaixo. Esta versão não processa cobranças automáticas.</p></details>
 <section className="card tecnicas-access"><h2>Liberar acesso</h2><div className="tecnicas-access-form"><Field label="Aluno"><select value={aluno} onChange={e=>{setAluno(e.target.value);const acesso=data.acessos.find(a=>a.id===e.target.value);if(acesso)setValidade(acesso.validoAte);}}><option value="">Selecione o aluno</option>{data.alunos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></Field><Field label="Acesso até (inclusive)"><input type="date" min={today()} value={validade} onChange={e=>setValidade(e.target.value)}/></Field><Button disabled={busy||!aluno||!validade} onClick={()=>void executar(()=>api('/tecnicas/acessos/'+aluno,{method:'PUT',body:JSON.stringify({validoAte:validade})}),'Acesso liberado até '+dateLabel(validade)+'.')}>Liberar / renovar</Button></div>
 {data.acessos.map(a=><div className="tecnicas-access-row" key={a.id}><div><strong>{data.alunos.find(v=>v.id===a.id)?.nome??'Aluno inativo'}</strong><small>{a.validoAte>=today()?'Ativo até':'Venceu em'} {dateLabel(a.validoAte)}</small></div><Button variant="ghost" disabled={busy} onClick={()=>{if(window.confirm('Remover o acesso deste aluno aos vídeos?'))void executar(()=>api('/tecnicas/acessos/'+a.id,{method:'DELETE'}),'Acesso removido.');}}>Remover acesso</Button></div>)}
 </section>
 {!data.videos.length?<Empty title="Seu primeiro vídeo começa aqui" description="Cadastre o título, a semana e o link da explicação."/>:<div className="tecnicas-grid">{data.videos.map(v=><article className="card tecnica-card" key={v.id}><div className="tecnica-cover"><Video size={32}/><span>{v.publicado?'Publicado':'Rascunho'}</span></div><div className="tecnica-body"><small>{dateLabel(v.semana)} · {v.tipoTreino}</small><h2>{v.titulo}</h2><p>{v.descricao}</p><Button variant="secondary" onClick={()=>setEdit(v)}>Editar vídeo</Button></div></article>)}</div>}
 <details className="card tecnicas-settings"><summary>Armazenamento de fotos e vídeos</summary><p>{data.armazenamentoConfigurado?'Conexão configurada. Prepare os buckets privados antes do primeiro envio.':'Para enviar arquivos, configure a conexão do Storage no servidor. Os links do YouTube e Vimeo continuam disponíveis.'}</p>{data.armazenamentoConfigurado&&<Button disabled={busy} onClick={()=>void executar(()=>api('/armazenamento/preparar',{method:'POST',body:'{}'}),'Buckets privados prontos para receber fotos e vídeos.')}>Preparar armazenamento</Button>}</details>
 </>}{edit!==undefined&&<VideoForm video={edit} armazenamentoConfigurado={Boolean(data?.armazenamentoConfigurado)} onClose={()=>setEdit(undefined)} onSaved={()=>{setEdit(undefined);void executar(()=>load(),'Vídeo salvo.');}}/>}</>;
}
function VideoForm({video,armazenamentoConfigurado,onClose,onSaved}:{video:VideoTecnica|null;armazenamentoConfigurado:boolean;onClose:()=>void;onSaved:()=>void}){
 const [titulo,setTitulo]=useState(video?.titulo??''),[descricao,setDescricao]=useState(video?.descricao??''),[semana,setSemana]=useState(video?.semana??today()),[tipoTreino,setTipo]=useState(video?.tipoTreino??'Com kimono'),[url,setUrl]=useState(video?.url??''),[publicado,setPublicado]=useState(video?.publicado??false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [origem,setOrigem]=useState(video?.url.startsWith('storage://')?'arquivo':'link'),[arquivo,setArquivo]=useState<File|null>(null),[enviado,setEnviado]=useState<{referencia:string;comprovante:string}|null>(null),[etapa,setEtapa]=useState('');
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
  let destino=url,comprovanteUpload:string|undefined;
  if(origem==='arquivo'){
   if(arquivo){
    let upload=enviado;
    if(!upload){
     if(arquivo.type!=='video/mp4'||arquivo.size>50*1024*1024||arquivo.size<12)throw new Error('Escolha um vídeo MP4 de até 50 MB.');
     const header=new Uint8Array(await arquivo.slice(0,12).arrayBuffer());if(String.fromCharCode(...header.slice(4,8))!=='ftyp')throw new Error('Escolha um arquivo MP4 válido.');
     setEtapa('Enviando vídeo… Mantenha esta janela aberta.');
     const ticket=await api<{url:string;referencia:string;comprovante:string}>('/tecnicas/uploads',{method:'POST',body:JSON.stringify({tamanho:arquivo.size,tipo:arquivo.type})});
     const response=await fetch(ticket.url,{method:'PUT',headers:{'Content-Type':'video/mp4','x-upsert':'false'},body:arquivo,credentials:'omit',referrerPolicy:'no-referrer'});
     if(!response.ok)throw new Error('Não foi possível enviar o vídeo. Confira sua conexão e tente novamente.');
     upload={referencia:ticket.referencia,comprovante:ticket.comprovante};setEnviado(upload);
    }
    destino=upload.referencia;comprovanteUpload=upload.comprovante;
   }else if(!video?.url.startsWith('storage://'))throw new Error('Selecione o arquivo do vídeo.');
  }
  setEtapa('Salvando vídeo…');
  await api('/tecnicas/videos'+(video?'/'+video.id:''),{method:video?'PUT':'POST',body:JSON.stringify({titulo,descricao,semana,tipoTreino,url:destino,publicado,...(comprovanteUpload?{comprovanteUpload}:{})})});onSaved();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);setEtapa('');}};
 return <Modal title={video?'Editar técnica':'Novo vídeo de técnica'} onClose={()=>{if(!busy)onClose();}}><form onSubmit={save}>
  <fieldset disabled={busy} className="tecnica-form-fields"><div className="form-grid">
   <Field label="Título"><input required maxLength={120} value={titulo} onChange={e=>setTitulo(e.target.value)}/></Field>
   <Field label="Data de referência da semana"><input required type="date" value={semana} onChange={e=>setSemana(e.target.value)}/></Field>
   <Field label="Tipo de treino"><select value={tipoTreino} onChange={e=>setTipo(e.target.value as typeof tipoTreino)}><option>Com kimono</option><option>Sem kimono</option></select></Field>
   <Field label="Origem do vídeo"><select value={origem} onChange={e=>setOrigem(e.target.value)}><option value="link">Link do YouTube ou Vimeo</option><option value="arquivo" disabled={!armazenamentoConfigurado&&origem!=='arquivo'}>Enviar arquivo privado</option></select></Field>
   {origem==='link'?<Field label="Link do vídeo (YouTube ou Vimeo)"><input required type="url" value={url.startsWith('storage://')?'':url} maxLength={500} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></Field>:<Field label="Arquivo de vídeo (MP4, até 50 MB)"><input type="file" accept="video/mp4,.mp4" onChange={e=>{setArquivo(e.target.files?.[0]??null);setEnviado(null);}}/>{arquivo?<small>{arquivo.name}</small>:video?.url.startsWith('storage://')&&<small>Vídeo privado já salvo. Escolha outro arquivo apenas para substituir.</small>}</Field>}
   <Field label="Explicação / pontos importantes"><textarea rows={4} maxLength={3000} value={descricao} onChange={e=>setDescricao(e.target.value)}/></Field>
   <label className="tecnicas-check"><input type="checkbox" checked={publicado} onChange={e=>setPublicado(e.target.checked)}/>Publicar para os alunos</label>
  </div></fieldset>
  <p className="helper">Vídeos futuros aparecem na data escolhida. Arquivos privados usam um link temporário após conferir o acesso do aluno. Links externos continuam disponíveis.</p>
  {etapa&&<p role="status">{etapa}</p>}<FormError message={error}/>
  <div className="form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Enviando…':'Salvar vídeo'}</Button></div>
 </form></Modal>;
}
export function TecnicasAluno({apiBase='/portal'}:{apiBase?:string}){
 const [data,setData]=useState<BibliotecaTecnicas|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(''),[link,setLink]=useState<{id:string;url:string}|null>(null),[semana,setSemana]=useState('');
 const carregar=useCallback(async(signal?:AbortSignal)=>{try{const result=await api<BibliotecaTecnicas>(apiBase+'/tecnicas',{signal});setData(result);setError('');setLink(atual=>result.liberado&&result.videos.some(v=>v.id===atual?.id)?atual:null);}catch(e){if(!signal?.aborted)setError((e as Error).message);}},[apiBase]);
 useEffect(()=>{const abort=new AbortController();setData(null);setLink(null);void carregar(abort.signal);const refresh=()=>{if(!document.hidden)void carregar(abort.signal);};const timer=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{abort.abort();clearInterval(timer);window.removeEventListener('focus',refresh);};},[carregar]);
 const assistir=async(id:string)=>{setBusy(id);setError('');setLink(null);try{const result=await api<{url:string}>(apiBase+'/tecnicas/'+id+'/assistir');setLink({id,url:result.url});}catch(e){setError((e as Error).message);}finally{setBusy('');}};
 return <section><div className="portal-section-heading"><div><h2>Técnicas da semana</h2><p>Reveja os detalhes e leve suas dúvidas para o próximo treino.</p></div><Button variant="secondary" disabled={Boolean(busy)} onClick={()=>void carregar()}>Atualizar vídeos</Button></div><FormError message={error}/>{!data?<Empty title={error?'Não foi possível carregar':'Preparando seus vídeos…'}/>:!data.config.ativa?<Empty title="Biblioteca ainda não disponível" description="A academia avisará quando os vídeos estiverem disponíveis."/>:<>
 <div className="card tecnicas-offer"><LockKeyhole size={24}/><div><strong>{data.liberado?'Acesso ativo até '+dateLabel(data.validoAte!):'Conteúdo extra · '+money(data.config.valorMensalCentavos)+'/mês'}</strong><p>{data.liberado?'Escolha uma técnica para revisar.':data.config.instrucoes||'Converse com a academia para contratar o acesso opcional.'}</p>{!data.liberado&&<small>A contratação é opcional e não altera seu plano de treinos. Pagamento e liberação são conferidos pela academia.</small>}</div></div>
 <Field label="Semana"><select value={semana} onChange={e=>{setSemana(e.target.value);setLink(null);}}><option value="">Todas as semanas</option>{[...new Set(data.videos.map(v=>v.semana))].map(s=><option key={s} value={s}>{dateLabel(s)}</option>)}</select></Field>
 <div className="tecnicas-grid">{data.videos.filter(v=>!semana||v.semana===semana).map(v=><article className="card tecnica-card" key={v.id}><div className="tecnica-cover"><Video size={32}/><span>{v.tipoTreino}</span></div><div className="tecnica-body"><small>Semana de {dateLabel(v.semana)}</small><h3>{v.titulo}</h3><p>{v.descricao}</p>{link?.id===v.id?<a className="tecnica-watch" href={link.url} target="_blank" rel="noopener noreferrer">Abrir vídeo <ExternalLink size={17}/></a>:<Button disabled={!data.liberado||Boolean(busy)} onClick={()=>void assistir(v.id)}>{!data.liberado?<><LockKeyhole size={16}/>Acesso opcional</>:busy===v.id?'Conferindo acesso…':'Assistir técnica'}</Button>}</div></article>)}</div>{!data.videos.length&&<Empty title="Novas técnicas em breve" description="Os vídeos publicados pela academia aparecerão aqui."/>}</>}</section>;
}
