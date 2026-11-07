import {Router} from 'express';
import {exigirArquivos,type Arquivos} from './storage.js';
export function arquivosRouter(arquivos:Arquivos|undefined){
 const router=Router();
 router.get('/',(_req,res)=>res.set('Cache-Control','private, no-store').json({configurado:Boolean(arquivos)}));
 router.post('/preparar',async(_req,res)=>{await exigirArquivos(arquivos).prepararBuckets();res.json({pronto:true});});
 return router;
}
