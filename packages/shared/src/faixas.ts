// Catálogo fixo da plataforma. Critérios de evolução são configurados separadamente.
export const FAIXAS_PADRAO = [
  {nome:'Branca',cor:'#F3F4F6',categoria:'Kids e adulto',padrao:'lisa'},
  {nome:'Cinza e Branca',cor:'#92999F',categoria:'Kids',padrao:'listra-branca'},
  {nome:'Cinza',cor:'#92999F',categoria:'Kids',padrao:'lisa'},
  {nome:'Cinza e Preta',cor:'#92999F',categoria:'Kids',padrao:'listra-preta'},
  {nome:'Amarela e Branca',cor:'#D9B329',categoria:'Kids',padrao:'listra-branca'},
  {nome:'Amarela',cor:'#D9B329',categoria:'Kids',padrao:'lisa'},
  {nome:'Amarela e Preta',cor:'#D9B329',categoria:'Kids',padrao:'listra-preta'},
  {nome:'Laranja e Branca',cor:'#D9692D',categoria:'Kids',padrao:'listra-branca'},
  {nome:'Laranja',cor:'#D9692D',categoria:'Kids',padrao:'lisa'},
  {nome:'Laranja e Preta',cor:'#D9692D',categoria:'Kids',padrao:'listra-preta'},
  {nome:'Verde e Branca',cor:'#21764F',categoria:'Kids',padrao:'listra-branca'},
  {nome:'Verde',cor:'#21764F',categoria:'Kids',padrao:'lisa'},
  {nome:'Verde e Preta',cor:'#21764F',categoria:'Kids',padrao:'listra-preta'},
  {nome:'Azul',cor:'#2B719E',categoria:'Adulto',padrao:'lisa'},
  {nome:'Roxa',cor:'#813FA4',categoria:'Adulto',padrao:'lisa'},
  {nome:'Marrom',cor:'#795333',categoria:'Adulto',padrao:'lisa'},
  {nome:'Preta',cor:'#252B31',categoria:'Adulto',padrao:'lisa'},
  {nome:'Vermelha e Preta',cor:'#BF3940',categoria:'Adulto',padrao:'coral-preta'},
  {nome:'Vermelha e Branca',cor:'#BF3940',categoria:'Adulto',padrao:'coral-branca'},
  {nome:'Vermelha',cor:'#BF3940',categoria:'Adulto',padrao:'lisa'},
] as const;
// Categorias explícitas. Os registros sem categoria continuam preservados como legados.
export const CATEGORIAS_FAIXA = ['Infantil','Juvenil','Adulto'] as const;
const porCategoria=(categoria:typeof CATEGORIAS_FAIXA[number],nomes:readonly string[])=>nomes.map(base=>{
  const faixa=FAIXAS_PADRAO.find(f=>f.nome===base)!;
  return {...faixa,base,categoria,nome:`${categoria} Faixa ${base.replaceAll(' e ',' / ')}`};
});
export const FAIXAS_CATEGORIA = [
  ...porCategoria('Infantil',FAIXAS_PADRAO.slice(0,13).map(f=>f.nome)),
  ...porCategoria('Juvenil',['Branca','Azul']),
  ...porCategoria('Adulto',['Branca','Azul','Roxa','Marrom','Preta']),
];
const chave=(nome:string)=>nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
export const faixaCategoria=(nome:string)=>FAIXAS_CATEGORIA.find(f=>chave(f.nome)===chave(nome));
export const faixaPadrao=(nome:string)=>faixaCategoria(nome)??FAIXAS_PADRAO.find(f=>chave(f.nome)===chave(nome));
export const ordemFaixa=(nome:string)=>{const nova=faixaCategoria(nome);if(nova)return FAIXAS_CATEGORIA.indexOf(nova)+1;const antiga=FAIXAS_PADRAO.find(f=>chave(f.nome)===chave(nome));return antiga?10000+FAIXAS_PADRAO.indexOf(antiga):20000;};
export function fundoFaixa(nome:string,corLegada?:string){
  const faixa=faixaPadrao(nome);if(!faixa)return corLegada;
  const cor=faixa.cor;
  if(faixa.padrao==='listra-branca'||faixa.padrao==='listra-preta'){
    const listra=faixa.padrao==='listra-branca'?'#F3F4F6':'#252B31';
    return `linear-gradient(to bottom, ${cor} 0 35%, ${listra} 35% 65%, ${cor} 65% 100%)`;
  }
  if(faixa.padrao==='coral-preta'||faixa.padrao==='coral-branca')return `repeating-linear-gradient(to right, ${cor} 0 25%, ${faixa.padrao==='coral-preta'?'#252B31':'#F3F4F6'} 25% 50%)`;
  return cor;
}

// Regra de produto definida pela academia; não impõe quatro graus à preta/corais.
export function limiteGrausPadrao(nome:string):4|null {
  const faixa=faixaPadrao(nome);
  const base=faixa&&'base' in faixa?faixa.base:faixa?.nome;
  return faixa&&!(['Preta','Vermelha e Preta','Vermelha e Branca','Vermelha'] as string[]).includes(base??'')?4:null;
}

export function limiteGrausRegistro(nome: string): 4 | 6 | null {
  const faixa = faixaPadrao(nome);
  const base = faixa && 'base' in faixa ? faixa.base : faixa?.nome;
  return base === 'Preta' ? 6 : limiteGrausPadrao(nome);
}
