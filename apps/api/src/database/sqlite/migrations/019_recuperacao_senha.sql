CREATE TABLE "RecuperacaoSenha" (
  "id" TEXT NOT NULL PRIMARY KEY REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "credencialHash" TEXT NOT NULL,
  "solicitadoEm" TEXT NOT NULL,
  "expiraEm" TEXT NOT NULL
);
