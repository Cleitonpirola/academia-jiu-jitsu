CREATE TABLE PlanoAluno (
  id TEXT PRIMARY KEY, alunoId TEXT NOT NULL UNIQUE REFERENCES Aluno(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL CHECK(length(trim(nome)) BETWEEN 2 AND 80),
  limiteSemanal INTEGER CHECK(limiteSemanal IS NULL OR (typeof(limiteSemanal) = 'integer' AND limiteSemanal BETWEEN 1 AND 100)),
  criadoEm TEXT NOT NULL, atualizadoEm TEXT NOT NULL
);
CREATE TABLE LiberacaoAula (
  id TEXT PRIMARY KEY, aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE RESTRICT,
  alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
  motivo TEXT NOT NULL CHECK(length(trim(motivo)) BETWEEN 3 AND 240),
  usuarioId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
  criadoEm TEXT NOT NULL, UNIQUE(aulaId, alunoId)
);
CREATE INDEX LiberacaoAula_alunoId_idx ON LiberacaoAula(alunoId);
