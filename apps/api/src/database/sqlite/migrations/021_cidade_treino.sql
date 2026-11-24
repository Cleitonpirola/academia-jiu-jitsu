ALTER TABLE HorarioTurma ADD COLUMN cidade TEXT CHECK (cidade IS NULL OR length(cidade) <= 80);
ALTER TABLE Aula ADD COLUMN cidade TEXT CHECK (cidade IS NULL OR length(cidade) <= 80);
