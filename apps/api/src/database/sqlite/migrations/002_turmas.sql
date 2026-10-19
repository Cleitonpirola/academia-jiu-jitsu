CREATE TABLE Turma (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  professor TEXT NOT NULL,
  situacao TEXT NOT NULL CHECK(situacao IN ('ativo', 'inativo')),
  criadoEm TEXT NOT NULL,
  atualizadoEm TEXT NOT NULL
);
CREATE TABLE HorarioTurma (
  id TEXT PRIMARY KEY,
  turmaId TEXT NOT NULL REFERENCES Turma(id) ON DELETE RESTRICT,
  diaSemana INTEGER NOT NULL CHECK(diaSemana BETWEEN 0 AND 6),
  horaInicio TEXT NOT NULL CHECK(horaInicio GLOB '[0-2][0-9]:[0-5][0-9]' AND horaInicio <= '23:59'),
  horaFim TEXT NOT NULL CHECK(horaFim GLOB '[0-2][0-9]:[0-5][0-9]' AND horaFim <= '23:59' AND horaFim > horaInicio),
  UNIQUE(turmaId, diaSemana, horaInicio)
);
CREATE TABLE AlunoTurma (
  id TEXT PRIMARY KEY,
  turmaId TEXT NOT NULL REFERENCES Turma(id) ON DELETE RESTRICT,
  alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
  criadoEm TEXT NOT NULL,
  UNIQUE(turmaId, alunoId)
);
CREATE INDEX AlunoTurma_alunoId_idx ON AlunoTurma(alunoId);
