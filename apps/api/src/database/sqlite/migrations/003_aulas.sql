CREATE TABLE Aula (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  dataAula TEXT NOT NULL,
  horaInicio TEXT NOT NULL CHECK(horaInicio GLOB '[0-2][0-9]:[0-5][0-9]' AND horaInicio <= '23:59'),
  horaFim TEXT NOT NULL CHECK(horaFim GLOB '[0-2][0-9]:[0-5][0-9]' AND horaFim <= '23:59' AND horaFim > horaInicio),
  professor TEXT NOT NULL,
  origem TEXT NOT NULL CHECK(origem IN ('grade', 'extra')),
  origemHorarioId TEXT,
  turmaId TEXT REFERENCES Turma(id) ON DELETE SET NULL,
  turmaNome TEXT,
  situacao TEXT NOT NULL CHECK(situacao IN ('agendada', 'cancelada')),
  motivoCancelamento TEXT,
  canceladaEm TEXT,
  criadoEm TEXT NOT NULL,
  CHECK((origem = 'grade' AND origemHorarioId IS NOT NULL) OR (origem = 'extra' AND origemHorarioId IS NULL)),
  CHECK((situacao = 'agendada' AND motivoCancelamento IS NULL AND canceladaEm IS NULL) OR (situacao = 'cancelada' AND motivoCancelamento IS NOT NULL AND canceladaEm IS NOT NULL)),
  UNIQUE(origemHorarioId, dataAula)
);
CREATE INDEX Aula_dataAula_idx ON Aula(dataAula);
CREATE INDEX Aula_turmaId_idx ON Aula(turmaId);
CREATE TABLE AulaAlunoPrevisto (
  id TEXT PRIMARY KEY,
  aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE RESTRICT,
  alunoId TEXT REFERENCES Aluno(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  UNIQUE(aulaId, alunoId)
);
CREATE INDEX AulaAlunoPrevisto_alunoId_idx ON AulaAlunoPrevisto(alunoId);
