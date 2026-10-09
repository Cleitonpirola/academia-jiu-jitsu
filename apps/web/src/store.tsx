import { createContext, useContext } from 'react';
import type { Aluno, MensalidadeView, PresencaView, Dashboard, Health, Analise } from '@tatame/shared';
export interface Data { alunos:Aluno[]; mensalidades:MensalidadeView[]; presencas:PresencaView[]; dashboard:Dashboard|null; health:Health|null; analises:Analise[] }
export interface Store extends Data { month:string; revision:number; mutate:(path:string,method:string,body:unknown,message:string)=>Promise<unknown>; reload:()=>Promise<void> }
export const StoreContext=createContext<Store|null>(null);
export function useAcademia() { const value=useContext(StoreContext);if(!value) throw new Error('Store ausente.');return value; }
