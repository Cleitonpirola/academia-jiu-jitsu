import { CATEGORIAS_FAIXA, faixaCategoria, limiteGrausRegistro } from '@tatame/shared';
import { Field, FormError } from '../components';
import { nomeGrau, useGraduacoes } from '../graduacoes';

type Props = {
  faixa: string;
  grauId: string | null;
  grauNumero?: number;
  onChange: (faixa: string, grauId: string | null, grauNumero?: number) => void;
};

export function SeletorGraduacao({ faixa, grauId, grauNumero, onChange }: Props) {
  const catalogo = useGraduacoes();
  const atual = catalogo?.faixas.find(f => f.nome === faixa);
  const limite = limiteGrausRegistro(faixa);
  const graus = atual?.graus ?? [];
  const opcoes = graus.filter(g => g.id === grauId || (
    g.situacao === 'ativo' && (limite === null || g.numero <= limite)
  )).map(g => ({ valor: g.id, numero: g.numero, inativo: g.situacao === 'inativo' }));

  if (atual && limite !== null) {
    for (let numero = 0; numero <= limite; numero++) {
      if (!graus.some(g => g.numero === numero)) {
        opcoes.push({ valor: `numero:${numero}`, numero, inativo: false });
      }
    }
  }
  opcoes.sort((a, b) => a.numero - b.numero);
  const valor = grauNumero === undefined ? grauId ?? '' : (
    opcoes.find(g => g.numero === grauNumero)?.valor ?? ''
  );

  return <>
    <Field label="Faixa">
      <select required disabled={!catalogo || Boolean(catalogo.error) || (catalogo.loading && !catalogo.faixas.length)} value={faixa} onChange={e => onChange(e.target.value, null)}>
        <option value="">Selecione uma faixa</option>
        {!atual && faixa && <option value={faixa}>{faixa} · cadastro anterior</option>}
        {CATEGORIAS_FAIXA.map(categoria => <optgroup key={categoria} label={categoria}>
          {catalogo?.faixas.filter(f => faixaCategoria(f.nome)?.categoria === categoria && (f.situacao === 'ativo' || f.nome === faixa))
            .map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
        </optgroup>)}
        {atual && !faixaCategoria(atual.nome) && <optgroup label="Cadastro anterior">
          <option value={atual.nome}>{atual.nome} · categoria não definida</option>
        </optgroup>}
      </select>
    </Field>
    <Field label="Grau na faixa">
      <select value={valor} disabled={!atual || Boolean(catalogo?.error)} onChange={e => {
        const selecao = e.target.value;
        if (selecao.startsWith('numero:')) onChange(faixa, null, Number(selecao.slice('numero:'.length)));
        else onChange(faixa, selecao || null);
      }}>
        <option value="">Não informado</option>
        {opcoes.map(g => <option key={g.valor} value={g.valor}>{nomeGrau(g.numero)}{g.inativo ? ' · Inativo' : ''}</option>)}
      </select>
    </Field>
    {catalogo?.error && <div className="field-full"><FormError message={'Não foi possível consultar faixas e graus. ' + catalogo.error}/></div>}
  </>;
}
