/** A consulta atual acompanha a virada; uma consulta histórica permanece selecionada. */
export function renovarPeriodoRanking(selecionado:string,anterior:string,atual:string){
 return selecionado===anterior?atual:selecionado;
}
