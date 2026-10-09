import { randomUUID } from 'node:crypto';
import { FAIXAS, type Aluno } from '@tatame/shared';
import type { Repository } from './repository.js';
import { currentMonth, dateAt, today, monthAt } from './domain.js';
const names = ['Rafael Oliveira','Mariana Santos','Lucas Ferreira','Beatriz Costa','Pedro Almeida','Camila Rodrigues','Gabriel Lima','Juliana Pereira','André Souza','Fernanda Carvalho','Bruno Martins','Larissa Gomes','Thiago Ribeiro','Amanda Alves','Diego Barbosa','Isabela Rocha','Felipe Nunes','Letícia Dias','Gustavo Mendes','Carolina Vieira'];
export async function seed(repo: Repository) {
  if ((await repo.list('Aluno')).length) return false;
  const now = new Date().toISOString();
  for (let i = 0; i < names.length; i++) {
    const aluno: Aluno = { id: randomUUID(), nome: names[i], telefone: `(11) 9${String(80000000+i*137).slice(0,4)}-${String(80000000+i*137).slice(4)}`, email: `aluno${i+1}@example.com`, dataNascimento: `${1987+i}-04-${String(10+i%18).padStart(2,'0')}`, faixa: FAIXAS[[0,5,6,0,7,5,8,0,6,5][i%10]], dataMatricula: i>=18 ? dateAt(0,1) : dateAt(-9,1+i%20), situacao: i%7===0?'inativo':'ativo', criadoEm: now };
    await repo.insert('Aluno', aluno);
    for(let offset=-5; offset<=0; offset++) {
      const competence=monthAt(offset); if(competence<aluno.dataMatricula.slice(0,7)) continue;
      const due=dateAt(offset,i%3===0?5:10);
      const unpaid=(offset===0 && i%4===0) || (offset===-1 && i%9===0);
      const payment=dateAt(offset, Math.min(i%3===0?5:8, Number(today().slice(8))));
      await repo.insert('Mensalidade',{ id:randomUUID(), alunoId:aluno.id, competencia:competence, valorCentavos:18000+(i%3)*2000, dataVencimento:due, dataPagamento:unpaid?null:(payment<=today()?payment:null), criadoEm:now });
    }
    for(let offset=-2;offset<=0;offset++) {
      const count=offset===0 && i%4===0?0: offset===0 && i%5===0?1:10;
      for(let n=0;n<count;n++) {
        const day=1+n*2; const date=dateAt(offset,day);
        if(date>today() || date<aluno.dataMatricula) continue;
        await repo.insert('Presenca',{ id:randomUUID(), alunoId:aluno.id, dataTreino:date, tipoTreino:'Com kimono', presente:n%7!==6 });
      }
    }
  }
  return true;
}
