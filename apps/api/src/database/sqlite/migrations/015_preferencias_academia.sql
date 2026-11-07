-- Somente preferência de exibição: não suspende limites, débitos ou bloqueios existentes.
CREATE TABLE PreferenciasAcademia(id TEXT PRIMARY KEY NOT NULL,exibirControlePlanos INTEGER NOT NULL DEFAULT 0 CHECK(exibirControlePlanos IN (0,1)),atualizadoEm TEXT NOT NULL,atualizadoPorId TEXT NOT NULL REFERENCES Usuario(id) ON DELETE RESTRICT);
