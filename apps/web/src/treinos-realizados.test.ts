import {it} from 'node:test';
import assert from 'node:assert/strict';
import type {AulaAlunoView} from '@tatame/shared';
import {contarAulasRealizadas} from './treinos-realizados';
it('aulas realizadas excluem reserva pendente, ausência, cancelamento e futuro, sem duplicar encontros',()=>{
 const aula=(id:string,changes:object={})=>({id,dataAula:'2026-10-27',situacao:'agendada',presenca:{presente:true},...changes}) as AulaAlunoView;
 const a=aula('primeira'),b=aula('segunda');
 assert.equal(contarAulasRealizadas([a,b,a,aula('pendente',{presenca:null,checkin:{id:'reserva'}}),aula('faltou',{presenca:{presente:false}}),aula('cancelada',{situacao:'cancelada'}),aula('amanha',{dataAula:'2026-10-28'})],'2026-10-27'),2);
});
