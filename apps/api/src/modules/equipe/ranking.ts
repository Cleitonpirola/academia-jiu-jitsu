import type {Aluno,Aula,PresencaAula,FotoPerfil,PosicaoRanking} from '@tatame/shared';
import {today} from '../../domain.js';
export function calcularRanking(alunos:Aluno[],aulas:Aula[],presencas:PresencaAula[],fotos:FotoPerfil[],periodo?:string,hoje=today()):PosicaoRanking[]{
 const ativos=new Map(alunos.filter(a=>a.situacao==='ativo').map(a=>[a.id,a]));
 const agenda=new Map(aulas.filter(a=>a.situacao!=='cancelada'&&a.dataAula<=hoje&&(!periodo||a.dataAula.startsWith(periodo+'-'))).map(a=>[a.id,a]));
 const contagem=new Map<string,Set<string>>();
 for(const p of presencas){const a=agenda.get(p.aulaId),aluno=ativos.get(p.alunoId);if(!p.presente||!a||!aluno||a.dataAula<aluno.dataMatricula)continue;const ids=contagem.get(p.alunoId)??new Set<string>();ids.add(p.aulaId);contagem.set(p.alunoId,ids);}
 const imagens=new Map(fotos.filter(f=>f.alunoId).map(f=>[f.alunoId!,f]));
 return [...contagem].map(([alunoId,ids])=>({alunoId,nome:ativos.get(alunoId)!.nome,aulas:ids.size,posicao:0,fotoUrl:imagens.has(alunoId)?`/api/equipe/alunos/${alunoId}/foto?v=${encodeURIComponent(imagens.get(alunoId)!.atualizadoEm)}`:null})).sort((a,b)=>b.aulas-a.aulas||a.nome.localeCompare(b.nome,'pt-BR')||a.alunoId.localeCompare(b.alunoId)).map((p,i)=>({...p,posicao:i+1}));
}
