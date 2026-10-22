CREATE TABLE Usuario (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin','aluno')),
  alunoId TEXT UNIQUE REFERENCES Aluno(id) ON DELETE RESTRICT,
  senhaHash TEXT,
  conviteHash TEXT UNIQUE,
  conviteExpiraEm TEXT,
  criadoEm TEXT NOT NULL,
  CHECK ((perfil='admin' AND alunoId IS NULL) OR (perfil='aluno' AND alunoId IS NOT NULL))
);
CREATE TABLE Sessao (
  id TEXT PRIMARY KEY NOT NULL,
  usuarioId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL UNIQUE,
  credencialHash TEXT NOT NULL,
  expiraEm TEXT NOT NULL,
  criadoEm TEXT NOT NULL
);
CREATE INDEX Sessao_usuarioId_idx ON Sessao(usuarioId);
CREATE TABLE CheckinAula (
  id TEXT PRIMARY KEY NOT NULL,
  aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE RESTRICT,
  alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  criadoEm TEXT NOT NULL,
  UNIQUE(aulaId,alunoId)
);
CREATE INDEX CheckinAula_alunoId_idx ON CheckinAula(alunoId);
