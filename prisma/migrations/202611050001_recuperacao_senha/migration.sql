CREATE TABLE "RecuperacaoSenha" (
  "id" UUID NOT NULL PRIMARY KEY REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "credencialHash" TEXT NOT NULL,
  "solicitadoEm" TEXT NOT NULL,
  "expiraEm" TEXT NOT NULL
);
CREATE UNIQUE INDEX "RecuperacaoSenha_tokenHash_key" ON "RecuperacaoSenha"("tokenHash");
ALTER TABLE "RecuperacaoSenha" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "RecuperacaoSenha" FROM PUBLIC, anon, authenticated, service_role;
