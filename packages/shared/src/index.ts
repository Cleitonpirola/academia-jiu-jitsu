export const FAIXAS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'] as const;
export type Faixa = string;
export interface FaixaGraduacao { id: string; nome: string; chave: string; cor: string; ordem: number; situacao: Situacao; criadoEm: string; atualizadoEm: string }
export type FaixaGraduacaoInput = Pick<FaixaGraduacao,'nome'|'cor'|'ordem'|'situacao'>;
export interface GrauFaixa { id: string; faixaId: string; numero: number; situacao: Situacao; criadoEm: string; atualizadoEm: string }
export type GrauFaixaInput = Pick<GrauFaixa,'numero'|'situacao'>;
export interface FaixaGraduacaoView extends FaixaGraduacao { graus: GrauFaixa[] }
export type Situacao = 'ativo' | 'inativo';
export type Status = 'pendente' | 'pago' | 'atrasado';
export interface Aluno {
  id: string; nome: string; telefone: string; email: string;
  dataNascimento: string; faixa: Faixa; dataMatricula: string; situacao: Situacao;
  criadoEm: string;
  limiteAulasMensal?: number | null; aulasRestantesMes?: number | null; mesSaldoAulas?: string | null;
  possuiCelular?: boolean; acessoPrincipal?: 'aluno' | 'responsavel'; responsabilidadeTransferidaEm?: string | null;
  faixaId?: string | null; grauId?: string | null;
}
export type AlunoInput = Omit<Aluno, 'id' | 'criadoEm' | 'limiteAulasMensal' | 'aulasRestantesMes' | 'mesSaldoAulas' | 'acessoPrincipal' | 'responsabilidadeTransferidaEm'>;
export type PerfilBasicoAluno = Pick<Aluno, 'nome' | 'telefone' | 'email'>;
export interface ResponsavelInput { nome: string; email: string; telefone: string; parentesco: string }
export interface ResponsavelAluno { id: string; alunoId: string; usuarioId: string; telefone: string; parentesco: string; tipoVinculo: 'responsavel' | 'contato' | 'arquivado'; criadoEm: string; atualizadoEm: string }
export interface EventoAcessoAluno { id: string; alunoId: string; usuarioId: string; tipo: string; detalhes: string; criadoEm: string }
export interface ComunicadoAluno { id: string; alunoId: string; destinatarioId: string; autorId: string; tipo: 'aviso' | 'autorizacao'; titulo: string; mensagem: string; resposta: 'ciente' | 'aceito' | 'recusado' | null; respondidoEm: string | null; criadoEm: string }
export interface ControleParental { aluno: Aluno; menor: boolean; responsaveis: (ResponsavelAluno & { nome: string; email: string; ativado: boolean })[]; eventos: EventoAcessoAluno[] }
export interface SaldoMensal { competencia: string; limiteMensal: number | null; utilizadas: number; adicionaisUtilizadas: number; restantes: number | null; limiteAtingido: boolean }
export interface ConfiguracaoAcademia { id: string; valorAulaAdicionalCentavos: number | null; prazoPagamentoDias: number; atualizadoEm: string; atualizadoPorId: string }
export type CondicoesAulaAdicional = Pick<ConfiguracaoAcademia, 'valorAulaAdicionalCentavos' | 'prazoPagamentoDias'>;
export interface AceiteAulaAdicional { valorEsperadoCentavos: number; prazoEsperadoDias: number }
export interface DebitoAula {
  id: string; alunoId: string; aulaId: string; motivo: string; aulaTitulo: string; dataAula: string; horaInicio: string;
  valorCentavos: number; prazoPagamentoDias: number; criadoEm: string; dataVencimento: string;
  statusPagamento: 'pendente' | 'pago' | 'cancelado'; dataPagamento: string | null; baixadoPorId: string | null;
  canceladoEm: string | null; motivoCancelamento: string | null;
}
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
export interface PresencaAula {
  id: string; aulaId: string; alunoId: string; nome: string; presente: boolean;
  criadoEm: string; atualizadoEm: string;
}
export interface CheckinAula { id: string; aulaId: string; alunoId: string; nome: string; criadoEm: string }
export interface PlanoAluno { id: string; alunoId: string; nome: string; limiteSemanal: number | null; criadoEm: string; atualizadoEm: string }
export interface LiberacaoAula { id: string; aulaId: string; alunoId: string; motivo: string; usuarioId: string; criadoEm: string }
export interface UsoPlano {
  nome: string; limiteSemanal: number | null; inicioSemana: string; fimSemana: string;
  utilizadas: number; extrasUtilizadas: number; restantes: number | null; limiteAtingido: boolean;
  aulasLiberadas: string[];
}
export interface GestaoPlano { plano: PlanoAluno | null; uso: UsoPlano; aulasHoje: Aula[]; liberacoes: (LiberacaoAula & { aula: Aula; utilizada: boolean })[] }
export interface AulaProfessor { id: string; aulaId: string; nome: string; ordem: number }
export interface AulaView extends Aula { professores: string[]; alunosPrevistos: AulaAlunoPrevisto[]; chamada: PresencaAula[]; checkins: CheckinAula[] }
export interface UsuarioView { id: string; nome: string; email: string; perfil: 'admin' | 'aluno' | 'responsavel'; alunoId: string | null }
export interface AuthState { configuracaoInicial: boolean; usuario: UsuarioView | null }
export interface AulaAlunoView extends Aula { checkin: CheckinAula | null; presenca: PresencaAula | null }
export interface PortalAluno {
  bloqueado: false;
  aluno: Aluno; aulas: AulaAlunoView[];
  mensalidades: (Mensalidade & { status: Status })[];
  historicoAntigo: Presenca[];
  plano: UsoPlano;
  saldoMensal: SaldoMensal;
  debitos: DebitoAula[]; condicoesAdicionais: CondicoesAulaAdicional;
  debitoVencido: boolean;
}
export interface BloqueioAluno {
  bloqueado: true; mensagem: string;
  pendencias: Pick<Mensalidade, 'id' | 'competencia' | 'valorCentavos' | 'dataVencimento'>[];
}
export type RespostaPortalAluno = PortalAluno | BloqueioAluno;
export interface AulaGradeInput { horarioId: string; dataAula: string }
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
