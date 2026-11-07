import {useEffect,useState,type ChangeEvent} from 'react';
import {Camera} from 'lucide-react';
import {Button,FormError} from '../components';
import {api,initials} from '../lib';
export function AvatarFoto({nome,src}:{nome:string;src?:string|null}){
 const [falhou,setFalhou]=useState(false),[versao,setVersao]=useState('');useEffect(()=>setFalhou(false),[src,versao]);useEffect(()=>{const refresh=()=>setVersao(String(Date.now()));window.addEventListener('tatame:foto-updated',refresh);return()=>window.removeEventListener('tatame:foto-updated',refresh);},[]);
 return <span className="avatar avatar-foto">{src&&!falhou?<img src={src.startsWith('/api/')&&versao?src+(src.includes('?')?'&':'?')+'foto='+versao:src} alt={`Foto de ${nome}`} loading="lazy" onError={()=>setFalhou(true)}/>:initials(nome)}</span>;
}
async function prepararFoto(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw new Error('Escolha uma foto JPG, PNG ou WebP de até 20 MB.');
 const url=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.readAsDataURL(file);});
 try{
  const img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a foto.');
  const lado=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-lado)/2,(img.naturalHeight-lado)/2,lado,lado,0,0,256,256);
  return canvas.toDataURL('image/jpeg',0.82);
 }catch{throw new Error('Não foi possível abrir essa imagem. Escolha outra foto JPG, PNG ou WebP.');}
}
export function FotoPerfilEditor({base='/perfil',titulo='Minha foto'}:{base?:string;titulo?:string}){
 const [foto,setFoto]=useState<string|null>(null),[draft,setDraft]=useState<string|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let ativo=true;setLoading(true);api<{imagem:string|null}>(base+'/foto').then(f=>{if(ativo){setFoto(f.imagem);setDraft(null);}}).catch(e=>{if(ativo)setError(e.message);}).finally(()=>{if(ativo)setLoading(false);});return()=>{ativo=false;};},[base]);
 const escolher=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setBusy(true);setError('');setNotice('');try{setDraft(await prepararFoto(f));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const salvar=async()=>{if(!draft)return;setBusy(true);setError('');try{await api(base+'/foto',{method:'PUT',body:JSON.stringify({imagem:draft})});setFoto(draft);setDraft(null);window.dispatchEvent(new Event('tatame:foto-updated'));setNotice('Foto salva. Ela aparecerá no seu perfil, nas presenças e no ranking.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const remover=async()=>{setBusy(true);setError('');try{await api(base+'/foto',{method:'DELETE'});setFoto(null);setDraft(null);window.dispatchEvent(new Event('tatame:foto-updated'));setNotice('Foto removida.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <section className="card portal-panel foto-editor"><h2>{titulo}</h2><div className="foto-editor-content"><div className="foto-preview">{draft||foto?<img src={draft||foto!} alt="Prévia da foto do perfil"/>:<Camera size={32}/>}</div><div><label className="btn btn-secondary foto-escolher">Escolher foto<input aria-label="Escolher foto do perfil" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||loading} onChange={e=>void escolher(e)}/></label><p className="helper">A foto será recortada em formato quadrado.</p>{draft&&<><Button disabled={busy} onClick={()=>void salvar()}>Salvar foto</Button><Button variant="ghost" disabled={busy} onClick={()=>setDraft(null)}>Cancelar</Button></>}{foto&&!draft&&<Button variant="ghost" disabled={busy} onClick={()=>void remover()}>Remover foto</Button>}</div></div><FormError message={error}/>{notice&&<p role="status" className="portal-notice">{notice}</p>}</section>;
}
