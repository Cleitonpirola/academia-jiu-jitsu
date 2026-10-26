BEGIN;
ALTER TABLE "Aluno" ADD COLUMN "limiteAulasMensal" INTEGER CHECK("limiteAulasMensal" IS NULL OR "limiteAulasMensal" BETWEEN 1 AND 1000);
ALTER TABLE "Aluno" ADD COLUMN "aulasRestantesMes" INTEGER CHECK("aulasRestantesMes" IS NULL OR "aulasRestantesMes" >= 0);
ALTER TABLE "Aluno" ADD COLUMN "mesSaldoAulas" VARCHAR(7);
COMMIT;
