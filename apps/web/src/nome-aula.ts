// O horário identifica o encontro da agenda que recebeu o check-in.
export function nomeAulaPorHorario(horaInicio:string){
 const [hora,minuto]=horaInicio.split(':');
 return `Aula das ${Number(hora)}h${minuto==='00'?'':minuto}`;
}
