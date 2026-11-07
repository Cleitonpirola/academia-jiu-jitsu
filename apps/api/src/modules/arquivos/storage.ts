import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {HttpError} from '../../http-error.js';

export const FOTO_BUCKET='tatame-fotos';
export const VIDEO_BUCKET='tatame-tecnicas';
export const MAX_VIDEO_BYTES=50*1024*1024;
export const VIDEO_TTL=600;
const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const referenciaSchema=z.string().regex(new RegExp(`^storage://(tatame-fotos|tatame-tecnicas)/(${uuid})/(${uuid})\\.(jpg|mp4)$`));
export function referenciaArquivo(value:string){
 if(!referenciaSchema.safeParse(value).success)throw new HttpError(400,'Referência de arquivo inválida.');
 const [bucket,...partes]=value.slice('storage://'.length).split('/');
 if((bucket===FOTO_BUCKET&&!value.endsWith('.jpg'))||(bucket===VIDEO_BUCKET&&!value.endsWith('.mp4')))throw new HttpError(400,'Tipo de arquivo inválido.');
 return {bucket,path:partes.join('/'),donoId:partes[0]};
}
export function isArquivo(value:string){return value.startsWith('storage://');}
export interface UploadVideo {url:string;referencia:string;comprovante:string;limiteBytes:number}
export interface Arquivos {
 prepararBuckets():Promise<void>;
 salvarFoto(donoId:string,imagem:string):Promise<string>;
 lerFoto(referencia:string,donoId:string):Promise<string>;
 remover(referencia:string):Promise<void>;
 prepararVideo(usuarioId:string,tamanho:number):Promise<UploadVideo>;
 confirmarVideo(referencia:string,comprovante:string,usuarioId:string):Promise<void>;
 assinarVideo(referencia:string):Promise<string>;
}
const ticketSchema=z.object({referencia:z.string(),usuarioId:z.string().uuid(),tamanho:z.number().int().positive().max(MAX_VIDEO_BYTES),expira:z.number().int()}).strict();
export class SupabaseArquivos implements Arquivos {
 private client;
 constructor(private origin:string,private secret:string,private fetcher:typeof fetch=fetch){
  this.client=createClient(origin,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:fetcher}});
 }
 private falha(){return new HttpError(503,'Armazenamento indisponível. Tente novamente ou avise a academia.');}
 async prepararBuckets(){
  for(const [id,limite,mime]of [[FOTO_BUCKET,130000,'image/jpeg'],[VIDEO_BUCKET,MAX_VIDEO_BYTES,'video/mp4']]as const){
   let {data,error}=await this.client.storage.getBucket(id);
   if(error&&(String(error.statusCode)==='404'||error.message==='Bucket not found')){
    const criado=await this.client.storage.createBucket(id,{public:false,fileSizeLimit:limite,allowedMimeTypes:[mime]});
    if(criado.error&&String(criado.error.statusCode)!=='409')throw this.falha();
    ({data,error}=await this.client.storage.getBucket(id));
   }
   if(error||!data)throw this.falha();
   if(data.public||Number(data.file_size_limit)!==limite||data.allowed_mime_types?.length!==1||data.allowed_mime_types[0]!==mime)throw new HttpError(409,'O bucket '+id+' precisa ser privado e ter os limites documentados. Confira sua configuração no Supabase.');
  }
 }
 async salvarFoto(donoId:string,imagem:string){
  z.string().uuid().parse(donoId);
  const path=donoId+'/'+randomUUID()+'.jpg',bytes=Buffer.from(imagem.split(',')[1],'base64');
  const {error}=await this.client.storage.from(FOTO_BUCKET).upload(path,bytes,{contentType:'image/jpeg',upsert:false,cacheControl:'0'});
  if(error)throw this.falha();
  return 'storage://'+FOTO_BUCKET+'/'+path;
 }
 async lerFoto(ref:string,donoId:string){
  const {bucket,path,donoId:owner}=referenciaArquivo(ref);
  if(bucket!==FOTO_BUCKET||owner!==donoId)throw new HttpError(404,'Foto indisponível.');
  const {data,error}=await this.client.storage.from(bucket).download(path);
  if(error||!data)throw this.falha();
  if(data.size>130000)throw this.falha();
  return 'data:image/jpeg;base64,'+Buffer.from(await data.arrayBuffer()).toString('base64');
 }
 async remover(ref:string){const {bucket,path}=referenciaArquivo(ref);const {error}=await this.client.storage.from(bucket).remove([path]);if(error)throw this.falha();}
 async prepararVideo(usuarioId:string,tamanho:number){
  z.string().uuid().parse(usuarioId);z.number().int().positive().max(MAX_VIDEO_BYTES).parse(tamanho);
  const path=usuarioId+'/'+randomUUID()+'.mp4',referencia='storage://'+VIDEO_BUCKET+'/'+path;
  const {data,error}=await this.client.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path,{upsert:false});
  if(error||!data)throw this.falha();
  const payload=Buffer.from(JSON.stringify({referencia,usuarioId,tamanho,expira:Date.now()+2*60*60*1000})).toString('base64url');
  const assinatura=createHmac('sha256',this.secret).update('tatame-upload:'+payload).digest('base64url');
  return {url:data.signedUrl,referencia,comprovante:payload+'.'+assinatura,limiteBytes:MAX_VIDEO_BYTES};
 }
 async confirmarVideo(ref:string,comprovante:string,usuarioId:string){
  const invalid=()=>new HttpError(400,'Envio inválido ou expirado. Selecione o vídeo novamente.');
  const partes=comprovante.split('.');if(partes.length!==2)throw invalid();
  const signature=createHmac('sha256',this.secret).update('tatame-upload:'+partes[0]).digest();
  const recebida=Buffer.from(partes[1],'base64url');
  if(recebida.length!==signature.length||!timingSafeEqual(recebida,signature))throw invalid();
  let ticket:z.infer<typeof ticketSchema>;try{ticket=ticketSchema.parse(JSON.parse(Buffer.from(partes[0],'base64url').toString()));}catch{throw invalid();}
  const {bucket,path,donoId}=referenciaArquivo(ref);
  if(ticket.referencia!==ref||ticket.usuarioId!==usuarioId||ticket.expira<Date.now()||bucket!==VIDEO_BUCKET||donoId!==usuarioId)throw invalid();
  const {data,error}=await this.client.storage.from(bucket).info(path);
  if(error||!data)throw new HttpError(409,'O vídeo ainda não foi enviado. Aguarde o envio e tente salvar novamente.');
  if((data.size??data.metadata?.size)!==ticket.tamanho||(data.contentType??data.metadata?.mimetype)!=='video/mp4')throw new HttpError(400,'O arquivo enviado não corresponde ao vídeo selecionado.');
  // Apenas os primeiros bytes: não passar o vídeo inteiro pela função da Vercel.
  const assinado=await this.client.storage.from(bucket).createSignedUrl(path,60);
  if(assinado.error||!assinado.data)throw this.falha();
  const resposta=await this.fetcher(assinado.data.signedUrl,{headers:{Range:'bytes=0-31'},signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!resposta.ok||!resposta.body)throw this.falha();
  const reader=resposta.body.getReader(),chunks:Uint8Array[]=[];let total=0;
  try{while(total<12){const {value,done}=await reader.read();if(done)break;chunks.push(value);total+=value.length;}}finally{await reader.cancel();}
  const header=Buffer.concat(chunks);
  if(header.length<12||header.toString('ascii',4,8)!=='ftyp')throw new HttpError(400,'Escolha um arquivo MP4 válido.');
 }
 async assinarVideo(ref:string){
  const {bucket,path}=referenciaArquivo(ref);if(bucket!==VIDEO_BUCKET)throw new HttpError(400,'Vídeo inválido.');
  const {data,error}=await this.client.storage.from(bucket).createSignedUrl(path,VIDEO_TTL);
  if(error||!data)throw this.falha();return data.signedUrl;
 }
}
export function configurarArquivos(env:NodeJS.ProcessEnv):Arquivos|undefined{
 const url=env.SUPABASE_URL,key=env.SUPABASE_SECRET_KEY;
 if(!url&&!key)return undefined;
 if(!url||!key)throw new Error('Configure SUPABASE_URL e SUPABASE_SECRET_KEY somente no servidor.');
 const origin=new URL(url);
 if(origin.origin!==url||origin.protocol!=='https:'||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||!key.startsWith('sb_secret_'))throw new Error('Configuração do Storage inválida. Use a URL do projeto e uma chave secreta sb_secret_, sem expor o valor.');
 return new SupabaseArquivos(url,key);
}
export function exigirArquivos(arquivos:Arquivos|undefined):Arquivos{if(!arquivos)throw new HttpError(503,'O armazenamento ainda não foi configurado pela academia.');return arquivos;}
export async function limparArquivo(arquivos:Arquivos|undefined,ref:string|undefined){
 if(arquivos&&ref&&isArquivo(ref))try{await arquivos.remover(ref);}catch{console.warn('Não foi possível remover um arquivo substituído. Conferir a manutenção do Storage.');}
}
