CREATE TABLE "PresencaAula" (
  "id" UUID PRIMARY KEY,
  "aulaId" UUID NOT NULL REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "nome" TEXT NOT NULL,
  "presente" BOOLEAN NOT NULL,
  "criadoEm" TEXT NOT NULL,
  "atualizadoEm" TEXT NOT NULL,
  CONSTRAINT "PresencaAula_aulaId_alunoId_key" UNIQUE ("aulaId", "alunoId")
);
CREATE INDEX "PresencaAula_alunoId_idx" ON "PresencaAula"("alunoId");
