CREATE TABLE "ConfiguracaoTecnicas" (
 "id" TEXT PRIMARY KEY CHECK("id"='principal'),
 "ativa" BOOLEAN NOT NULL DEFAULT false,
 "valorMensalCentavos" INTEGER NOT NULL CHECK("valorMensalCentavos">0),
 "instrucoes" TEXT NOT NULL,
 "atualizadoEm" TEXT NOT NULL
);
CREATE TABLE "VideoTecnica" (
 "id" UUID PRIMARY KEY,
 "titulo" TEXT NOT NULL,
 "descricao" TEXT NOT NULL,
 "semana" VARCHAR(10) NOT NULL,
 "tipoTreino" TEXT NOT NULL CHECK("tipoTreino" IN ('Com kimono','Sem kimono')),
 "url" TEXT NOT NULL,
 "publicado" BOOLEAN NOT NULL DEFAULT false,
 "criadoEm" TEXT NOT NULL,
 "atualizadoEm" TEXT NOT NULL
);
CREATE INDEX "VideoTecnica_semana_idx" ON "VideoTecnica"("semana");
CREATE TABLE "AcessoTecnicas" (
 "id" UUID PRIMARY KEY REFERENCES "Aluno"("id") ON DELETE RESTRICT,
 "validoAte" VARCHAR(10) NOT NULL,
 "liberadoPorId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
 "atualizadoEm" TEXT NOT NULL
);
CREATE INDEX "AcessoTecnicas_liberadoPorId_idx" ON "AcessoTecnicas"("liberadoPorId");
ALTER TABLE "ConfiguracaoTecnicas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VideoTecnica" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AcessoTecnicas" ENABLE ROW LEVEL SECURITY;
-- As tabelas introduzidas pelas migrações pendentes 11–17 são privadas da API Node.
ALTER TABLE "AulaProfessor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegraGraduacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EstadoGraduacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventoGraduacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PreferenciasAcademia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoteComunicado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EntregaComunicado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FotoPerfil" ENABLE ROW LEVEL SECURITY;
