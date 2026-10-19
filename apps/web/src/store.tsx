import { createContext, useContext } from 'react';
import type { Data, ResourceStatus } from './data';
export type { Data } from './data';
export interface Store extends Data { resourceStatus:ResourceStatus; month:string; revision:number; mutate:(path:string,method:string,body:unknown,message:string)=>Promise<unknown>; reload:()=>Promise<void> }
export const StoreContext=createContext<Store|null>(null);
export function useAcademia() { const value=useContext(StoreContext);if(!value) throw new Error('Store ausente.');return value; }
