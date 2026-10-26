export interface Usuario {
  id: string; nome: string; email: string; perfil: 'admin' | 'aluno' | 'responsavel'; alunoId: string | null;
  senhaHash: string | null; conviteHash: string | null; conviteExpiraEm: string | null; criadoEm: string;
}
export interface Sessao { id: string; usuarioId: string; tokenHash: string; credencialHash: string; expiraEm: string; criadoEm: string }
