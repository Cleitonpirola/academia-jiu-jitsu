CREATE TABLE "Aula" (
  "id" UUID PRIMARY KEY, "titulo" TEXT NOT NULL, "dataAula" TEXT NOT NULL,
  "horaInicio" VARCHAR(5) NOT NULL CHECK ("horaInicio" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  "horaFim" VARCHAR(5) NOT NULL CHECK ("horaFim" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "horaFim" > "horaInicio"),
  "professor" TEXT NOT NULL, "origem" TEXT NOT NULL CHECK ("origem" IN ('grade', 'extra')),
  "origemHorarioId" UUID,
  "turmaId" UUID REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "turmaNome" TEXT,
  "situacao" TEXT NOT NULL CHECK ("situacao" IN ('agendada', 'cancelada')),
  "motivoCancelamento" TEXT, "canceladaEm" TEXT, "criadoEm" TEXT NOT NULL,
  CHECK (("origem" = 'grade' AND "origemHorarioId" IS NOT NULL) OR ("origem" = 'extra' AND "origemHorarioId" IS NULL)),
  CHECK (("situacao" = 'agendada' AND "motivoCancelamento" IS NULL AND "canceladaEm" IS NULL) OR ("situacao" = 'cancelada' AND "motivoCancelamento" IS NOT NULL AND "canceladaEm" IS NOT NULL)),
  CONSTRAINT "Aula_origemHorarioId_dataAula_key" UNIQUE ("origemHorarioId", "dataAula")
);
CREATE INDEX "Aula_dataAula_idx" ON "Aula"("dataAula");
CREATE INDEX "Aula_turmaId_idx" ON "Aula"("turmaId");
CREATE TABLE "AulaAlunoPrevisto" (
  "id" UUID PRIMARY KEY,
  "aulaId" UUID NOT NULL REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "alunoId" UUID REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "nome" TEXT NOT NULL,
  CONSTRAINT "AulaAlunoPrevisto_aulaId_alunoId_key" UNIQUE ("aulaId", "alunoId")
);
CREATE INDEX "AulaAlunoPrevisto_alunoId_idx" ON "AulaAlunoPrevisto"("alunoId");
