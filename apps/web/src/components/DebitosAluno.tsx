import { useCallback, useEffect, useState } from 'react';
import type { DebitoAula } from '@tatame/shared';
import { Badge, Button, Empty, Field, FormError } from '../components';
import { api, dateLabel, money, today } from '../lib';

export function ListaDebitos({ itens, onPagar }: { itens: (DebitoAula & { alunoNome?: string })[]; onPagar?: (item: DebitoAula) => void }) {
  const [filtro,setFiltro]=useState('pendentes');
  const rows=itens.filter(item=>filtro==='todos'||(filtro==='pendentes'&&item.statusPagamento==='pendente')||(filtro==='pagos'&&item.statusPagamento==='pago')||(filtro==='cancelados'&&item.statusPagamento==='cancelado'));
  const total=itens.filter(item=>item.statusPagamento==='pendente').reduce((sum,item)=>sum+item.valorCentavos,0);
  return <><div className="portal-section-heading"><p><strong>{money(total)}</strong> pendentes</p><Field label="Filtrar débitos"><select value={filtro} onChange={event=>setFiltro(event.target.value)}><option value="pendentes">Pendentes</option><option value="todos">Todos</option><option value="pagos">Pagos</option><option value="cancelados">Cancelados</option></select></Field></div>
    <div className="debitos-list">{rows.map(item=><article className="card debito-card" key={item.id}><div className="portal-section-heading"><div><h3>{item.motivo}</h3>{item.alunoNome&&<p>{item.alunoNome}</p>}</div><strong>{money(item.valorCentavos)}</strong></div>
      <Badge value={item.statusPagamento==='pendente'&&item.dataVencimento<today()?'atrasado':item.statusPagamento}/>
      <dl className="detail-grid"><div><dt>Gerado em</dt><dd>{new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(item.criadoEm))}</dd></div><div><dt>Data da aula</dt><dd>{dateLabel(item.dataAula)} · {item.horaInicio}</dd></div><div><dt>Vencimento</dt><dd>{dateLabel(item.dataVencimento)}</dd></div><div><dt>Pagamento</dt><dd>{item.dataPagamento?dateLabel(item.dataPagamento):'—'}</dd></div></dl>
      {item.canceladoEm&&<p className="helper">Aula cancelada: {item.motivoCancelamento}.{item.statusPagamento==='pago'?' Combine eventual devolução com a academia.':' O débito pendente foi cancelado.'}</p>}
      {onPagar&&item.statusPagamento==='pendente'&&!item.canceladoEm&&<Button variant="secondary" onClick={()=>onPagar(item)}>Marcar como pago</Button>}
    </article>)}</div>{!rows.length&&<Empty title="Nenhum débito neste filtro" description="Aulas adicionais confirmadas e seus pagamentos aparecerão aqui."/>}</>;
}
export function DebitosAluno({apiBase='/portal'}:{apiBase?:string}) {
  const [rows,setRows]=useState<DebitoAula[]|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const load=useCallback(async()=>{setLoading(true);try{setRows(await api<DebitoAula[]>(apiBase+'/debitos'));setError('');}catch(error){setError((error as Error).message);}finally{setLoading(false);}},[apiBase]);
  useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};const timer=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
  return <section className="portal-panel"><div className="portal-section-heading"><div><h2>Meus débitos</h2><p className="helper">Consulte o professor para pagar e registrar a baixa. Pagamento online ainda não está disponível.</p></div><Button variant="secondary" disabled={loading} onClick={()=>void load()}>Atualizar débitos</Button></div><FormError message={error}/>{rows?<ListaDebitos itens={rows}/>:<p>{loading?'Consultando débitos…':'Não foi possível consultar os débitos.'}</p>}</section>;
}
