CREATE TABLE "LoteComunicado" (
 "id" UUID PRIMARY KEY, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL, "mensagem" TEXT NOT NULL,
 "autorId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT, "criadoEm" TEXT NOT NULL, "pendencias" TEXT NOT NULL
);
CREATE TABLE "EntregaComunicado" (
 "id" UUID PRIMARY KEY, "loteId" UUID NOT NULL REFERENCES "LoteComunicado"("id") ON DELETE RESTRICT,
 "comunicadoId" UUID NOT NULL UNIQUE REFERENCES "ComunicadoAluno"("id") ON DELETE RESTRICT, "nome" TEXT NOT NULL
);
CREATE INDEX "EntregaComunicado_lote" ON "EntregaComunicado"("loteId");
