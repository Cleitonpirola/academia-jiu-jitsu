import {it} from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {gzipSync} from 'node:zlib';
import {SqliteRepository} from './repository.js';
import {createApp} from './app.js';

it('JSON comprimido inválido não derruba a API nem dispensa autenticação',async()=>{
 const repo=new SqliteRepository(':memory:'),app=createApp(repo),server=app.listen(0,'127.0.0.1');
 await new Promise<void>((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
 const port=(server.address() as {port:number}).port;
 const enviar=(body:Buffer)=>new Promise<number>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port,path:'/api/auth/sair',method:'POST',headers:{'Content-Type':'application/json','Content-Encoding':'gzip','Content-Length':body.length,'X-Tatame-Request':'1'}},res=>{res.resume();res.once('end',()=>resolve(res.statusCode!));});
  req.once('error',reject);req.end(body);
 });
 try{
  assert.equal(await enviar(gzipSync('{}')),204);
  const invalid=Buffer.concat([gzipSync('{}'),Buffer.from('trailing-invalid-gzip-data')]);
  assert.equal(await enviar(invalid),400);
  // Uma segunda requisição completa prova que o processo continua atendendo.
  const response=await fetch('http://127.0.0.1:'+port+'/api/alunos');
  assert.equal(response.status,401);await response.arrayBuffer();
 }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));await repo.close();}
});
