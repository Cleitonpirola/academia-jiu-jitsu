import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Field } from '../components';
import { today } from '../lib';

const dataMinima = '1900-01-08';
const dataMaxima = '9999-12-24';

function dataPermitida(dia: string) {
  return dia >= dataMinima && dia <= dataMaxima;
}

export function deslocarDia(dia: string, quantidade: number) {
  const data = new Date(dia + 'T12:00:00Z');
  data.setUTCDate(data.getUTCDate() + quantidade);
  return data.toISOString().slice(0, 10);
}

export function DiasAulas({ dia, onChange, diasComAula = [] }: { dia: string; onChange: (dia: string) => void; diasComAula?: string[] }) {
  const atual = dia || today();
  const diaDaSemana = new Date(atual + 'T12:00:00Z').getUTCDay();
  const segunda = deslocarDia(atual, -((diaDaSemana + 6) % 7));
  const semanaAnterior = deslocarDia(atual, -7);
  const proximaSemana = deslocarDia(atual, 7);
  const marcados = new Set(diasComAula);

  return (
    <div className="dias-aulas">
      <div className="dias-cabecalho">
        <Field label="Dia das aulas">
          <input
            aria-label="Dia das aulas"
            type="date"
            min={dataMinima}
            max={dataMaxima}
            value={dia}
            onChange={e => {
              if (dataPermitida(e.target.value)) onChange(e.target.value);
            }}
          />
        </Field>
        <Button variant="ghost" onClick={() => onChange(today())}>Hoje</Button>
      </div>
      <div className="dias-faixa">
        <button type="button" aria-label="Semana anterior" disabled={!dataPermitida(semanaAnterior)} onClick={() => onChange(semanaAnterior)}>
          <ChevronLeft size={19} />
        </button>
        {[0, 1, 2, 3, 4, 5, 6].map(indice => {
          const valor = deslocarDia(segunda, indice);
          const data = new Date(valor + 'T12:00:00Z');
          const selecionado = dia === valor;
          return (
            <button
              key={valor}
              type="button"
              className={selecionado ? 'selected' : ''}
              aria-pressed={selecionado}
              aria-label={data.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })}
              disabled={!dataPermitida(valor)}
              onClick={() => onChange(valor)}
            >
              <small>{data.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short' }).replace('.', '')}</small>
              <strong>{data.getUTCDate()}</strong>
              <i className={marcados.has(valor) ? 'tem-aula' : ''} />
            </button>
          );
        })}
        <button type="button" aria-label="Próxima semana" disabled={!dataPermitida(proximaSemana)} onClick={() => onChange(proximaSemana)}>
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}
