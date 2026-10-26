CREATE TABLE ConfiguracaoAcademia (
  id TEXT PRIMARY KEY CHECK(id='principal'),
  valorAulaAdicionalCentavos INTEGER CHECK(valorAulaAdicionalCentavos IS NULL OR valorAulaAdicionalCentavos BETWEEN 1 AND 1000000),
  prazoPagamentoDias INTEGER NOT NULL DEFAULT 3 CHECK(prazoPagamentoDias BETWEEN 1 AND 90),
  atualizadoEm TEXT NOT NULL, atualizadoPorId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT
);
CREATE TABLE DebitoAula (
  id TEXT PRIMARY KEY, alunoId TEXT NOT NULL REFERENCES Aluno(id) ON DELETE RESTRICT,
  aulaId TEXT NOT NULL REFERENCES Aula(id) ON DELETE RESTRICT,
  motivo TEXT NOT NULL, aulaTitulo TEXT NOT NULL, dataAula TEXT NOT NULL, horaInicio TEXT NOT NULL,
  valorCentavos INTEGER NOT NULL CHECK(valorCentavos BETWEEN 1 AND 1000000),
  prazoPagamentoDias INTEGER NOT NULL CHECK(prazoPagamentoDias BETWEEN 1 AND 90),
  criadoEm TEXT NOT NULL, dataVencimento TEXT NOT NULL,
  statusPagamento TEXT NOT NULL CHECK(statusPagamento IN ('pendente','pago','cancelado')),
  dataPagamento TEXT, baixadoPorId TEXT REFERENCES Usuario(id) ON DELETE RESTRICT,
  canceladoEm TEXT, motivoCancelamento TEXT,
  UNIQUE(alunoId,aulaId),
  CHECK((statusPagamento='pago' AND dataPagamento IS NOT NULL AND baixadoPorId IS NOT NULL) OR (statusPagamento<>'pago' AND dataPagamento IS NULL AND baixadoPorId IS NULL))
);
CREATE INDEX DebitoAula_alunoId_vencimento_idx ON DebitoAula(alunoId,dataVencimento);
