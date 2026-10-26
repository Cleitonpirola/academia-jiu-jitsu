ALTER TABLE Aluno ADD COLUMN possuiCelular INTEGER NOT NULL DEFAULT 1 CHECK(possuiCelular IN (0,1));
ALTER TABLE Aluno ADD COLUMN acessoPrincipal TEXT NOT NULL DEFAULT 'aluno' CHECK(acessoPrincipal IN ('aluno','responsavel'));
ALTER TABLE Aluno ADD COLUMN responsabilidadeTransferidaEm TEXT;
CREATE TABLE Usuario_novo (
 id TEXT PRIMARY KEY NOT NULL, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 perfil TEXT NOT NULL CHECK(perfil IN ('admin','aluno','responsavel')),
 alunoId TEXT UNIQUE REFERENCES Aluno(id) ON DELETE RESTRICT,
 senhaHash TEXT, conviteHash TEXT UNIQUE, conviteExpiraEm TEXT, criadoEm TEXT NOT NULL,
 CHECK((perfil IN ('admin','responsavel') AND alunoId IS NULL) OR (perfil='aluno' AND alunoId IS NOT NULL))
);
INSERT INTO Usuario_novo SELECT id,nome,email,perfil,alunoId,senhaHash,conviteHash,conviteExpiraEm,criadoEm FROM Usuario;
DROP TABLE Usuario;
ALTER TABLE Usuario_novo RENAME TO Usuario;
CREATE TABLE ResponsavelAluno (
 id TEXT PRIMARY KEY, alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
 usuarioId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
 telefone TEXT NOT NULL, parentesco TEXT NOT NULL,
 tipoVinculo TEXT NOT NULL CHECK(tipoVinculo IN ('responsavel','contato','arquivado')),
 criadoEm TEXT NOT NULL, atualizadoEm TEXT NOT NULL,
 UNIQUE(alunoId,usuarioId)
);
CREATE UNIQUE INDEX ResponsavelAluno_principal_idx ON ResponsavelAluno(alunoId) WHERE tipoVinculo='responsavel';
CREATE TABLE EventoAcessoAluno (
 id TEXT PRIMARY KEY, alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
 usuarioId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
 tipo TEXT NOT NULL, detalhes TEXT NOT NULL, criadoEm TEXT NOT NULL
);
CREATE TABLE ComunicadoAluno (
 id TEXT PRIMARY KEY, alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
 destinatarioId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
 autorId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
 tipo TEXT NOT NULL CHECK(tipo IN ('aviso','autorizacao')), titulo TEXT NOT NULL, mensagem TEXT NOT NULL,
 resposta TEXT CHECK(resposta IS NULL OR resposta IN ('ciente','aceito','recusado')),
 respondidoEm TEXT, criadoEm TEXT NOT NULL
);
