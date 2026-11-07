import {FotoPerfilEditor} from '../components/FotoPerfil';
import {useEffect,useState,type FormEvent} from 'react';
import {Button,FormError} from '../components';
import {api} from '../lib';
import {usePreferenciasAcademia} from '../preferencias-academia';
export function ConfiguracoesPage(){
 const {preferencias,error:loadError,reload}=usePreferenciasAcademia();
 const [ativo,setAtivo]=useState(false),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{if(preferencias&&!dirty)setAtivo(preferencias.exibirControlePlanos);},[preferencias,dirty]);
 const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');try{await api('/configuracoes/academia',{method:'PUT',body:JSON.stringify({exibirControlePlanos:ativo})});await reload();setDirty(false);setNotice('Configuração salva. Os limites e débitos já cadastrados foram mantidos.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <><div className="page-heading"><div><div className="eyebrow">DO JEITO DA SUA ACADEMIA</div><h1>Configurações<span className="heading-dot">.</span></h1><p>Ative os controles que sua academia utiliza.</p></div></div><section className="card portal-panel"><h2>Planos com limite de aulas</h2><p className="helper">Ative para configurar alunos que pagam por uma quantidade de aulas. Desativar apenas oculta os controles; limites existentes continuam valendo.</p><FormError message={loadError||error}/>{notice&&<p className="portal-notice" role="status">{notice}</p>}<form onSubmit={save}><label className="checkbox-label"><input type="checkbox" checked={ativo} disabled={busy||!preferencias} onChange={e=>{setAtivo(e.target.checked);setDirty(true);setNotice('');}}/>Exibir controles de planos limitados</label><div className="form-actions"><Button type="submit" disabled={busy||!preferencias}>{busy?'Salvando…':'Salvar configurações'}</Button></div></form>{loadError&&<Button variant="secondary" onClick={()=>void reload()}>Tentar novamente</Button>}</section><FotoPerfilEditor/></>;
}
