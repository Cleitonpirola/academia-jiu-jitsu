export const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
export const money = (cents: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const dateLabel = (value: string) => value ? new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')) : '—';
export const monthLabel = (value: string, short=false) => new Intl.DateTimeFormat('pt-BR',{month:short?'short':'long',...(!short?{year:'numeric' as const}:{}),timeZone:'UTC'}).format(new Date(value+'-01T12:00:00Z'));
export const monthOffset = (value: string, offset: number) => {const [y,m]=value.split('-').map(Number);return new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7);};
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0,2).map(v=>v[0]).join('');
export const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json','X-Tatame-Request':'1',...options.headers},signal:options.signal || AbortSignal.timeout(path==='/assistente'?60000:15000)}); }
  catch { throw new Error('Não foi possível conectar ao servidor. Confira se o projeto está em execução.'); }
  if(response.status===204) return undefined as T;
  const body=await response.json().catch(()=>({message:'Resposta inválida do servidor.'}));
  if(!response.ok) { if(response.status===401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('tatame:session-expired')); throw new Error(body.message || 'Não foi possível concluir a operação.'); }
  return body as T;
}
