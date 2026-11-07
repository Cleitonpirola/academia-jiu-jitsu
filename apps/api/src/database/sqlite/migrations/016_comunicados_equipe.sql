CREATE TABLE "LoteComunicado" (
 "id" TEXT PRIMARY KEY, "tipo" TEXT NOT NULL, "titulo" TEXT NOT NULL, "mensagem" TEXT NOT NULL,
 "autorId" TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT, "criadoEm" TEXT NOT NULL, "pendencias" TEXT NOT NULL
);
CREATE TABLE "EntregaComunicado" (
 "id" TEXT PRIMARY KEY, "loteId" TEXT NOT NULL REFERENCES "LoteComunicado"("id") ON DELETE RESTRICT,
 "comunicadoId" TEXT NOT NULL UNIQUE REFERENCES "ComunicadoAluno"("id") ON DELETE RESTRICT, "nome" TEXT NOT NULL
);
CREATE INDEX "EntregaComunicado_lote" ON "EntregaComunicado"("loteId");
