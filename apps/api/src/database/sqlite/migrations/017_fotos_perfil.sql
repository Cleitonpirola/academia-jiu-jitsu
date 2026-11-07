CREATE TABLE "FotoPerfil" (
 "id" TEXT PRIMARY KEY, "alunoId" TEXT UNIQUE REFERENCES "Aluno"("id") ON DELETE CASCADE,
 "usuarioId" TEXT UNIQUE REFERENCES "Usuario"("id") ON DELETE CASCADE,
 "imagem" TEXT NOT NULL, "atualizadoEm" TEXT NOT NULL,
 CHECK (("alunoId" IS NOT NULL AND "usuarioId" IS NULL) OR ("usuarioId" IS NOT NULL AND "alunoId" IS NULL))
);
