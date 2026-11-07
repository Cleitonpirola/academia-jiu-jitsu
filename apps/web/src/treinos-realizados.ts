import type {AulaAlunoView} from '@tatame/shared';
// Check-in reserva uma participação; realização depende da presença validada.
export function contarAulasRealizadas(aulas:AulaAlunoView[],hoje:string){
 return new Set(aulas.filter(a=>a.situacao!=='cancelada'&&a.dataAula<=hoje&&a.presenca?.presente===true).map(a=>a.id)).size;
}
