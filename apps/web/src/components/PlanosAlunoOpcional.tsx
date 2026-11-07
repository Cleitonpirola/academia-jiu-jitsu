import {useEffect,useState} from 'react';
import type {Aluno,GestaoPlano,SaldoMensal} from '@tatame/shared';
import {api} from '../lib';
import {Button,FormError} from '../components';
import {usePreferenciasAcademia} from '../preferencias-academia';
import {PlanoAlunoEditor} from './PlanoAluno';
import {SaldoMensalAlunoEditor} from './SaldoMensalAluno';
export function PlanosAlunoOpcional({aluno}:{aluno:Aluno}){
 const {preferencias,error:preferenciaError}=usePreferenciasAcademia();
 const [aberto,setAberto]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!preferencias?.exibirControlePlanos){setAberto(false);return;}let active=true;setLoading(true);void Promise.all([api<GestaoPlano>(`/alunos/${aluno.id}/plano`),api<SaldoMensal>(`/alunos/${aluno.id}/saldo-mensal`)]).then(([plano,saldo])=>{if(active){setAberto(plano.uso.limiteSemanal!==null||saldo.limiteMensal!==null);setError('');}}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[aluno.id,preferencias?.exibirControlePlanos]);
 if(preferenciaError)return <FormError message={'Não foi possível consultar a configuração dos planos: '+preferenciaError}/>;
 if(!preferencias?.exibirControlePlanos)return null;
 return <><FormError message={error}/>{loading?<p className="helper">Consultando limites deste aluno…</p>:!aberto?<Button variant="secondary" onClick={()=>setAberto(true)}>Definir plano com limite de aulas</Button>:<><PlanoAlunoEditor aluno={aluno}/><SaldoMensalAlunoEditor aluno={aluno}/></>}</>;
}
