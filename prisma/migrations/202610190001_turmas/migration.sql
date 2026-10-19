CREATE TABLE "Turma" (
  "id" UUID PRIMARY KEY, "nome" TEXT NOT NULL, "professor" TEXT NOT NULL,
  "situacao" TEXT NOT NULL CHECK ("situacao" IN ('ativo', 'inativo')),
  "criadoEm" TEXT NOT NULL, "atualizadoEm" TEXT NOT NULL
);
CREATE TABLE "HorarioTurma" (
  "id" UUID PRIMARY KEY,
  "turmaId" UUID NOT NULL REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "diaSemana" INTEGER NOT NULL CHECK ("diaSemana" BETWEEN 0 AND 6),
  "horaInicio" VARCHAR(5) NOT NULL CHECK ("horaInicio" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  "horaFim" VARCHAR(5) NOT NULL CHECK ("horaFim" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "horaFim" > "horaInicio"),
  CONSTRAINT "HorarioTurma_turmaId_diaSemana_horaInicio_key" UNIQUE ("turmaId", "diaSemana", "horaInicio")
);
CREATE TABLE "AlunoTurma" (
  "id" UUID PRIMARY KEY,
  "turmaId" UUID NOT NULL REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "criadoEm" TEXT NOT NULL,
  CONSTRAINT "AlunoTurma_turmaId_alunoId_key" UNIQUE ("turmaId", "alunoId")
);
CREATE INDEX "AlunoTurma_alunoId_idx" ON "AlunoTurma"("alunoId");
