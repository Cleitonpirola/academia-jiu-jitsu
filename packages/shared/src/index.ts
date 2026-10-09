export const FAIXAS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'] as const;
export type Faixa = typeof FAIXAS[number];
export type Situacao = 'ativo' | 'inativo';
export type Status = 'pendente' | 'pago' | 'atrasado';
export interface Aluno {
  id: string; nome: string; telefone: string; email: string;
  dataNascimento: string; faixa: Faixa; dataMatricula: string; situacao: Situacao;
  criadoEm: string;
}
export type AlunoInput = Omit<Aluno, 'id' | 'criadoEm'>;
export interface Mensalidade {
  id: string; alunoId: string; competencia: string; valorCentavos: number;
  dataVencimento: string; dataPagamento: string | null; criadoEm: string;
}
export interface MensalidadeView extends Mensalidade { alunoNome: string; status: Status; faixa: Faixa }
export type MensalidadeInput = Omit<Mensalidade, 'id' | 'criadoEm'>;
export interface Presenca {
  id: string; alunoId: string; dataTreino: string; tipoTreino: string; presente: boolean;
}
export interface PresencaView extends Presenca { alunoNome: string }
export type PresencaInput = Omit<Presenca, 'id'>;
export interface Analise {
  id: string; pergunta: string; resposta: string; modelo: string; usuario: string;
  metricas: string; criadoEm: string;
}
export interface Health {
  database: 'sqlite' | 'supabase'; aiConfigured: boolean; analyticsAvailable: boolean;
}
export interface Dashboard {
  totalAlunos: number; ativos: number; inativos: number; novos: number;
  pagas: number; pendentes: number; atrasadas: number;
  recebidoCentavos: number; pendenteCentavos: number;
  receita: { mes: string; recebidoCentavos: number; previstoCentavos: number }[];
}
export interface RiscoAluno {
  alunoId: string; nome: string; faixa: Faixa; frequenciaAtual: number;
  frequenciaAnterior: number; diasSemTreinar: number; pontos: number;
  nivel: 'baixo' | 'medio' | 'alto'; sinais: string[];
}
export interface Analytics {
  mes: string; dataReferencia: string; alunosAtivos: number; alunosInadimplentes: number;
  receitaCentavos: number; inadimplenciaCentavos: number; frequenciaMedia: number;
  alunosEmRisco: number; presencasNoMes: number; riscos: RiscoAluno[];
  receitaMensal: { mes: string; receitaCentavos: number }[];
}
