CREATE TABLE PresencaAula (
  id TEXT PRIMARY KEY,
  aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE RESTRICT,
  alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  presente INTEGER NOT NULL CHECK(presente IN (0, 1)),
  criadoEm TEXT NOT NULL,
  atualizadoEm TEXT NOT NULL,
  UNIQUE(aulaId, alunoId)
);
CREATE INDEX PresencaAula_alunoId_idx ON PresencaAula(alunoId);
