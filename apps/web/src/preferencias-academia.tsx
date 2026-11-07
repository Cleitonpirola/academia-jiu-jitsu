import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import type {PreferenciasAcademia} from '@tatame/shared';
import {api} from './lib';
type Preferencia=Pick<PreferenciasAcademia,'exibirControlePlanos'>;
const Context=createContext<{preferencias:Preferencia|null;error:string;reload:()=>Promise<void>}|null>(null);
export function PreferenciasAcademiaProvider({children}:{children:ReactNode}){
 const [preferencias,setPreferencias]=useState<Preferencia|null>(null),[error,setError]=useState('');
 const reload=useCallback(async()=>{try{setPreferencias(await api<Preferencia>('/configuracoes/academia'));setError('');}catch(e){setPreferencias(null);setError((e as Error).message);}},[]);
 useEffect(()=>{void reload();const refresh=()=>{if(!document.hidden)void reload();};window.addEventListener('focus',refresh);const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload]);
 return <Context.Provider value={{preferencias,error,reload}}>{children}</Context.Provider>;
}
export const usePreferenciasAcademia=()=>useContext(Context)!;
