CREATE TABLE "FotoPerfil" (
 "id" UUID PRIMARY KEY, "alunoId" UUID UNIQUE REFERENCES "Aluno"("id") ON DELETE CASCADE,
 "usuarioId" UUID UNIQUE REFERENCES "Usuario"("id") ON DELETE CASCADE,
 "imagem" TEXT NOT NULL, "atualizadoEm" TEXT NOT NULL,
 CHECK (("alunoId" IS NOT NULL AND "usuarioId" IS NULL) OR ("usuarioId" IS NOT NULL AND "alunoId" IS NULL))
);
