CREATE TABLE "Usuario" (
 "id" UUID NOT NULL PRIMARY KEY, "nome" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE,
 "perfil" TEXT NOT NULL CHECK ("perfil" IN ('admin','aluno')),
 "alunoId" UUID UNIQUE REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "senhaHash" TEXT, "conviteHash" TEXT UNIQUE, "conviteExpiraEm" TEXT, "criadoEm" TEXT NOT NULL,
 CHECK (("perfil"='admin' AND "alunoId" IS NULL) OR ("perfil"='aluno' AND "alunoId" IS NOT NULL))
);
CREATE TABLE "Sessao" (
 "id" UUID NOT NULL PRIMARY KEY, "usuarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
 "tokenHash" TEXT NOT NULL UNIQUE, "credencialHash" TEXT NOT NULL, "expiraEm" TEXT NOT NULL, "criadoEm" TEXT NOT NULL
);
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");
CREATE TABLE "CheckinAula" (
 "id" UUID NOT NULL PRIMARY KEY, "aulaId" UUID NOT NULL REFERENCES "Aula"("id") ON DELETE RESTRICT,
 "alunoId" UUID NOT NULL REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "nome" TEXT NOT NULL, "criadoEm" TEXT NOT NULL,
 CONSTRAINT "CheckinAula_aulaId_alunoId_key" UNIQUE ("aulaId", "alunoId")
);
CREATE INDEX "CheckinAula_alunoId_idx" ON "CheckinAula"("alunoId");
