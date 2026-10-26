import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FaixaGraduacaoView } from '@tatame/shared';
import { api } from './lib';

const Context=createContext<{faixas:FaixaGraduacaoView[];loading:boolean;error:string;reload:()=>Promise<void>}|null>(null);
export const nomeGrau=(numero:number)=>numero===0?'Sem graus':`${numero}º grau`;
export function GraduacoesProvider({children}:{children:ReactNode}){
  const [faixas,setFaixas]=useState<FaixaGraduacaoView[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const reload=useCallback(async()=>{setLoading(true);try{setFaixas(await api<FaixaGraduacaoView[]>('/graduacoes'));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
  useEffect(()=>{void reload();const refresh=()=>{if(!document.hidden)void reload();};const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload]);
  return <Context.Provider value={{faixas,loading,error,reload}}>{children}</Context.Provider>;
}
export const useGraduacoes=()=>useContext(Context);
