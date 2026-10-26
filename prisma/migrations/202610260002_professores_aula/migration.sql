BEGIN;
CREATE TABLE "AulaProfessor" (
  id UUID PRIMARY KEY,
  "aulaId" UUID NOT NULL REFERENCES "Aula"(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL CHECK(ordem BETWEEN 0 AND 7),
  UNIQUE("aulaId", ordem),
  UNIQUE("aulaId", nome)
);
INSERT INTO "AulaProfessor" (id, "aulaId", nome, ordem) SELECT id, id, professor, 0 FROM "Aula";
COMMIT;
