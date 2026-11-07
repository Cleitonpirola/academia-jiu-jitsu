CREATE TABLE ConfiguracaoTecnicas (
 id TEXT PRIMARY KEY CHECK(id='principal'),
 ativa INTEGER NOT NULL DEFAULT 0 CHECK(ativa IN (0,1)),
 valorMensalCentavos INTEGER NOT NULL CHECK(valorMensalCentavos>0),
 instrucoes TEXT NOT NULL,
 atualizadoEm TEXT NOT NULL
);
CREATE TABLE VideoTecnica (
 id TEXT PRIMARY KEY,
 titulo TEXT NOT NULL,
 descricao TEXT NOT NULL,
 semana TEXT NOT NULL,
 tipoTreino TEXT NOT NULL CHECK(tipoTreino IN ('Com kimono','Sem kimono')),
 url TEXT NOT NULL,
 publicado INTEGER NOT NULL DEFAULT 0 CHECK(publicado IN (0,1)),
 criadoEm TEXT NOT NULL,
 atualizadoEm TEXT NOT NULL
);
CREATE INDEX VideoTecnica_semana_idx ON VideoTecnica(semana);
CREATE TABLE AcessoTecnicas (
 id TEXT PRIMARY KEY REFERENCES Aluno(id) ON DELETE RESTRICT,
 validoAte TEXT NOT NULL,
 liberadoPorId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT,
 atualizadoEm TEXT NOT NULL
);
CREATE INDEX AcessoTecnicas_liberadoPorId_idx ON AcessoTecnicas(liberadoPorId);
