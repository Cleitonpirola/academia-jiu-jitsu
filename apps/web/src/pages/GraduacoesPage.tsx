import { useState } from 'react';
import { Award } from 'lucide-react';
import { CATEGORIAS_FAIXA, faixaCategoria } from '@tatame/shared';
import type { FaixaGraduacaoView } from '@tatame/shared';
import { Belt, Button, Empty, FormError, Modal } from '../components';
import { useGraduacoes } from '../graduacoes';
import { RegraGraduacaoEditor } from '../components/RegraGraduacaoEditor';

export function GraduacoesPage(){
  const catalogo=useGraduacoes(),[selecionada,setSelecionada]=useState('');
  const faixas=catalogo?.faixas??[],faixa=faixas.find(f=>f.id===selecionada);
  const card=(f:FaixaGraduacaoView)=><article className="card" key={f.id}><Belt value={f.nome}/><Button variant="secondary" onClick={()=>setSelecionada(f.id)} aria-label={`Configurar aulas da faixa ${f.nome}`}><Award size={15}/>Configurar aulas</Button></article>;
  return <><div className="page-heading"><div><div className="eyebrow">A EVOLUÇÃO NO TATAME</div><h1>Regras de graduação<span className="heading-dot">.</span></h1><p>Defina as aulas por grau de cada faixa e categoria.</p></div></div><FormError message={catalogo?.error??''}/>
    {catalogo?.error?<Button variant="secondary" onClick={()=>void catalogo.reload()}>Tentar carregar faixas</Button>:!catalogo||catalogo.loading&&!faixas.length?<p>Consultando faixas…</p>:<>{CATEGORIAS_FAIXA.map(categoria=><section className="faixa-categoria" key={categoria}><h2>{categoria}</h2><div className="faixa-catalogo">{faixas.filter(f=>faixaCategoria(f.nome)?.categoria===categoria).map(card)}</div></section>)}{!faixas.length&&<Empty title="Catálogo ainda não disponível" description="Verifique se as migrações locais foram aplicadas."/>}</>}
    {faixa&&<Modal title={`Aulas por grau · ${faixa.nome}`} onClose={()=>setSelecionada('')}><RegraGraduacaoEditor key={faixa.id} faixa={faixa}/></Modal>}
  </>;
}
