CREATE TABLE "PlanoAluno" (
  "id" UUID PRIMARY KEY, "alunoId" UUID NOT NULL UNIQUE REFERENCES "Aluno"("id") ON DELETE RESTRICT,
  "nome" TEXT NOT NULL CHECK(length(trim("nome")) BETWEEN 2 AND 80),
  "limiteSemanal" INTEGER CHECK("limiteSemanal" IS NULL OR "limiteSemanal" BETWEEN 1 AND 100),
  "criadoEm" TEXT NOT NULL, "atualizadoEm" TEXT NOT NULL
);
CREATE TABLE "LiberacaoAula" (
  "id" UUID PRIMARY KEY, "aulaId" UUID NOT NULL REFERENCES "Aula"("id") ON DELETE RESTRICT,
  "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT,
  "motivo" TEXT NOT NULL CHECK(length(trim("motivo")) BETWEEN 3 AND 240),
  "usuarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
  "criadoEm" TEXT NOT NULL, UNIQUE("aulaId", "alunoId")
);
CREATE INDEX "LiberacaoAula_alunoId_idx" ON "LiberacaoAula"("alunoId");
