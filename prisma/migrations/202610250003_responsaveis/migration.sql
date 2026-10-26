BEGIN;
ALTER TABLE "Aluno" ADD COLUMN "possuiCelular" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Aluno" ADD COLUMN "acessoPrincipal" TEXT NOT NULL DEFAULT 'aluno' CHECK("acessoPrincipal" IN ('aluno','responsavel'));
ALTER TABLE "Aluno" ADD COLUMN "responsabilidadeTransferidaEm" TEXT;
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_perfil_check";
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_check";
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfil_check" CHECK("perfil" IN ('admin','aluno','responsavel'));
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_check" CHECK(("perfil" IN ('admin','responsavel') AND "alunoId" IS NULL) OR ("perfil"='aluno' AND "alunoId" IS NOT NULL));
CREATE TABLE "ResponsavelAluno" (
 "id" UUID PRIMARY KEY, "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "usuarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
 "telefone" TEXT NOT NULL, "parentesco" TEXT NOT NULL,
 "tipoVinculo" TEXT NOT NULL CHECK("tipoVinculo" IN ('responsavel','contato','arquivado')),
 "criadoEm" TEXT NOT NULL, "atualizadoEm" TEXT NOT NULL, UNIQUE("alunoId","usuarioId")
);
CREATE UNIQUE INDEX "ResponsavelAluno_principal_idx" ON "ResponsavelAluno"("alunoId") WHERE "tipoVinculo"='responsavel';
CREATE TABLE "EventoAcessoAluno" (
 "id" UUID PRIMARY KEY, "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "usuarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
 "tipo" TEXT NOT NULL, "detalhes" TEXT NOT NULL, "criadoEm" TEXT NOT NULL
);
CREATE TABLE "ComunicadoAluno" (
 "id" UUID PRIMARY KEY, "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "destinatarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
 "autorId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
 "tipo" TEXT NOT NULL CHECK("tipo" IN ('aviso','autorizacao')), "titulo" TEXT NOT NULL, "mensagem" TEXT NOT NULL,
 "resposta" TEXT CHECK("resposta" IS NULL OR "resposta" IN ('ciente','aceito','recusado')),
 "respondidoEm" TEXT, "criadoEm" TEXT NOT NULL
);
COMMIT;
