CREATE TABLE AulaProfessor (
  id TEXT PRIMARY KEY NOT NULL,
  aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL CHECK(ordem BETWEEN 0 AND 7),
  UNIQUE(aulaId, ordem),
  UNIQUE(aulaId, nome)
);
-- O professor existente é um único nome histórico, sem tentar separá-lo por vírgulas.
INSERT INTO AulaProfessor (id, aulaId, nome, ordem) SELECT id, id, professor, 0 FROM Aula;
