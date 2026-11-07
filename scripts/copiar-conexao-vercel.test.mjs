import {it} from 'node:test';
import assert from 'node:assert/strict';
import {prepararConexaoVercel} from './copiar-conexao-vercel.mjs';
it('prepara Transaction pooler sem modificar a fonte nem enfraquecer TLS',()=>{
 const source='postgresql://postgres.projetoteste:senha%40teste@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full';
 const result=new URL(prepararConexaoVercel(source,'projetoteste'));
 assert.equal(result.port,'6543');assert.equal(result.password,'senha%40teste');assert.equal(result.searchParams.get('sslmode'),'verify-full');assert.ok(source.includes(':5432/'));
});
it('recusa outro projeto, destino externo e TLS desativado sem vazar credenciais no erro',()=>{
 for(const source of ['postgresql://postgres.outro:credencial@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full','postgresql://postgres.projetoteste:credencial@host.externo:5432/postgres?sslmode=verify-full','postgresql://postgres.projetoteste:credencial@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=disable'])assert.throws(()=>prepararConexaoVercel(source,'projetoteste'),error=>{assert.ok(!error.message.includes('credencial'));return true;});
});
