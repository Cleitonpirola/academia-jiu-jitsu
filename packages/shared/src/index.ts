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
export const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'] as const;
export interface Turma {
  id: string; nome: string; professor: string; situacao: Situacao;
  criadoEm: string; atualizadoEm: string;
}
export interface HorarioTurma {
  id: string; turmaId: string; diaSemana: number; horaInicio: string; horaFim: string;
}
export interface AlunoTurma { id: string; turmaId: string; alunoId: string; criadoEm: string }
export interface TurmaInput {
  nome: string; professor: string; situacao: Situacao;
  horarios: Pick<HorarioTurma, 'diaSemana' | 'horaInicio' | 'horaFim'>[];
  alunoIds: string[];
}
export interface TurmaView extends Turma { horarios: HorarioTurma[]; alunoIds: string[] }
export type SituacaoAula = 'agendada' | 'cancelada';
export interface Aula {
  id: string; titulo: string; dataAula: string; horaInicio: string; horaFim: string;
  professor: string; origem: 'grade' | 'extra'; origemHorarioId: string | null;
  turmaId: string | null; turmaNome: string | null; situacao: SituacaoAula;
  motivoCancelamento: string | null; canceladaEm: string | null; criadoEm: string;
}
export interface AulaAlunoPrevisto { id: string; aulaId: string; alunoId: string | null; nome: string }
export interface AulaView extends Aula { alunosPrevistos: AulaAlunoPrevisto[] }
export interface AulaGradeInput { horarioId: string; dataAula: string }
export interface AulaExtraInput {
  titulo: string; dataAula: string; horaInicio: string; horaFim: string;
  professor: string; turmaId: string | null;
}
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
