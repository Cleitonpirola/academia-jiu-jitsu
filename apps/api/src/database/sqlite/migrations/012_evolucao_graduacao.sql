CREATE TABLE RegraGraduacao (
 id TEXT PRIMARY KEY NOT NULL, faixaId TEXT NOT NULL UNIQUE REFERENCES FaixaGraduacao(id) ON DELETE CASCADE,
 aulasPorGrau INTEGER CHECK(aulasPorGrau BETWEEN 1 AND 100000), mesesPorGrau INTEGER CHECK(mesesPorGrau BETWEEN 1 AND 1200),
 grausParaFaixa INTEGER NOT NULL CHECK(grausParaFaixa BETWEEN 0 AND 99), mesesMinimosFaixa INTEGER NOT NULL CHECK(mesesMinimosFaixa BETWEEN 0 AND 1200),
 proximaFaixaId TEXT REFERENCES FaixaGraduacao(id) ON DELETE RESTRICT, atualizadoEm TEXT NOT NULL,
 CHECK(proximaFaixaId IS NULL OR proximaFaixaId<>faixaId)
);
CREATE TABLE EstadoGraduacao (
 id TEXT PRIMARY KEY NOT NULL, alunoId TEXT NOT NULL UNIQUE REFERENCES Aluno(id) ON DELETE RESTRICT,
 faixaId TEXT NOT NULL REFERENCES FaixaGraduacao(id) ON DELETE RESTRICT, dataInicioFaixa TEXT NOT NULL,
 aulasAnteriores INTEGER NOT NULL CHECK(aulasAnteriores BETWEEN 0 AND 100000), marcoAulas TEXT NOT NULL DEFAULT '[]',
 versao INTEGER NOT NULL CHECK(versao>0), atualizadoEm TEXT NOT NULL
);
CREATE TABLE EventoGraduacao (
 id TEXT PRIMARY KEY NOT NULL, alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
 tipo TEXT NOT NULL CHECK(tipo IN ('ajuste','grau','faixa','solicitacao')), faixaAnterior TEXT NOT NULL, faixaNova TEXT NOT NULL,
 grauAnterior INTEGER, grauNovo INTEGER, aulasConsideradas INTEGER NOT NULL, motivo TEXT NOT NULL,
 autorId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT, versaoEstado INTEGER NOT NULL, regraSnapshot TEXT, criadoEm TEXT NOT NULL
);
CREATE UNIQUE INDEX EventoGraduacao_solicitacao_unica ON EventoGraduacao(alunoId,versaoEstado) WHERE tipo='solicitacao';
CREATE INDEX EventoGraduacao_aluno_criado ON EventoGraduacao(alunoId,criadoEm);
