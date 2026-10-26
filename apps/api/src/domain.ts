import { z } from 'zod';
import { FAIXAS, type Mensalidade, type Status, type Dashboard, type Aluno } from '@tatame/shared';
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const currentMonth = () => today().slice(0, 7);
export const monthAt = (offset: number, month = currentMonth()) => { const [y,m] = month.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0,7); };
export const dateAt = (offset: number, day: number, month = currentMonth()) => `${monthAt(offset, month)}-${String(day).padStart(2,'0')}`;
export const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v && v >= '1900-01-01';
const date = z.string().refine(isDate, 'Informe uma data válida.');
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Competência inválida.');
export const alunoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(120),
  telefone: z.string().trim().max(40),
  email: z.union([z.literal(''),z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(180)]),
  possuiCelular: z.boolean().optional(),
  dataNascimento: date.refine(v => v <= today(), 'Nascimento não pode estar no futuro.'),
  faixa: z.string().trim().min(1).max(80),
  faixaId: z.string().uuid().nullable().optional(),
  grauId: z.string().uuid().nullable().optional(),
  dataMatricula: date.refine(v => v <= today(), 'Matrícula não pode estar no futuro.'),
  situacao: z.enum(['ativo','inativo']),
}).strict().superRefine((v,ctx)=>{
  const [ano,mes,dia]=v.dataNascimento.split('-');
  const menor=today()<String(Number(ano)+18)+'-'+mes+'-'+dia;
  if(v.possuiCelular===false&&!menor)ctx.addIssue({code:'custom',message:'O acesso por responsável é destinado a menores de idade.',path:['possuiCelular']});
  if(v.possuiCelular!==false){
    if(!/^\d{8,15}$/.test(v.telefone.replace(/\D/g,'')))ctx.addIssue({code:'custom',message:'Informe um telefone válido.',path:['telefone']});
    if(!v.email||v.email.endsWith('@cadastro.invalid'))ctx.addIssue({code:'custom',message:'Informe um e-mail próprio válido.',path:['email']});
  }
}).refine(v => v.dataNascimento <= v.dataMatricula, { message: 'Matrícula deve ser posterior ao nascimento.', path: ['dataMatricula'] });
export const mensalidadeSchema = z.object({
  alunoId: z.string().uuid('Aluno inválido.'), competencia: monthSchema,
  valorCentavos: z.number().int('Use um valor com no máximo duas casas decimais.').positive('Valor deve ser maior que zero.').max(100_000_000),
  dataVencimento: date,
  dataPagamento: date.refine(v => v <= today(), 'Pagamento não pode estar no futuro.').nullable(),
}).strict();
export const paymentSchema = z.object({ dataPagamento: date.refine(v => v <= today(), 'Pagamento não pode estar no futuro.') }).strict();
export const presencaSchema = z.object({
  alunoId: z.string().uuid(), dataTreino: date.refine(v => v <= today(), 'Treino não pode estar no futuro.'),
  tipoTreino: z.enum(['Com kimono','Sem kimono','Fundamentos','Competição']), presente: z.boolean(),
}).strict();
export const statusOf = (m: Pick<Mensalidade,'dataPagamento'|'dataVencimento'>, reference = today()): Status => m.dataPagamento ? 'pago' : m.dataVencimento < reference ? 'atrasado' : 'pendente';
export function dashboard(alunos: Aluno[], mensalidades: Mensalidade[], month: string): Dashboard {
  const invoices = mensalidades.filter(m => m.competencia === month);
  const income = (mes: string) => mensalidades.filter(m => m.dataPagamento?.startsWith(mes)).reduce((sum,m)=>sum+m.valorCentavos,0);
  return {
    totalAlunos: alunos.length, ativos: alunos.filter(a=>a.situacao==='ativo').length,
    inativos: alunos.filter(a=>a.situacao==='inativo').length, novos: alunos.filter(a=>a.dataMatricula.startsWith(month)).length,
    pagas: invoices.filter(m=>statusOf(m)==='pago').length,
    pendentes: invoices.filter(m=>statusOf(m)==='pendente').length,
    atrasadas: invoices.filter(m=>statusOf(m)==='atrasado').length,
    recebidoCentavos: income(month),
    pendenteCentavos: mensalidades.filter(m=>!m.dataPagamento && m.dataVencimento.startsWith(month)).reduce((sum,m)=>sum+m.valorCentavos,0),
    receita: Array.from({ length: 6 }, (_,i) => { const mes = monthAt(i-5,month); return { mes, recebidoCentavos: income(mes), previstoCentavos: mensalidades.filter(m=>m.dataVencimento.startsWith(mes)).reduce((s,m)=>s+m.valorCentavos,0) }; }),
  };
}
