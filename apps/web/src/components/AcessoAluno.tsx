import { useEffect, useState } from 'react';
import type { Aluno } from '@tatame/shared';
import { Button, FormError } from '../components';
import { api } from '../lib';

export function AcessoAluno({ aluno }: { aluno: Aluno }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [acessoAtivado, setAcessoAtivado] = useState<boolean | null>(null);
  const endpoint = '/auth/alunos/' + aluno.id + '/convite';

  useEffect(() => {
    if (aluno.acessoPrincipal === 'responsavel') return;
    const controller = new AbortController();
    setAcessoAtivado(null);
    void api<{ acessoAtivado: boolean }>(endpoint, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setAcessoAtivado(result.acessoAtivado); })
      .catch(error => { if (!controller.signal.aborted) setError((error as Error).message); });
    return () => controller.abort();
  }, [aluno.acessoPrincipal, endpoint]);

  const generate = async () => {
    setBusy(true); setError(''); setLink(''); setCopied(false);
    try {
      const result = await api<{ token: string; email: string }>(endpoint, { method: 'POST' });
      setLink(window.location.origin + '/#ativar=' + result.token); setEmail(result.email);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { setError('Selecione e copie o link abaixo manualmente.'); }
  };
  if(aluno.acessoPrincipal==='responsavel')return <section className="student-access"><h3>Área do aluno</h3><p className="helper">O acesso principal está com o responsável. Use a seção abaixo para gerar o convite ou ativar o acesso próprio.</p></section>;
  return <section className="student-access"><h3>Área do aluno</h3>
    <FormError message={error}/>
    {acessoAtivado === null && !error && <p className="helper">Consultando acesso…</p>}
    {acessoAtivado === true && <p className="helper">Acesso já ativado.</p>}
    {acessoAtivado === false && <><p className="helper">O convite de primeiro acesso vale por 24 horas e pode ser usado uma vez.</p><Button variant="secondary" disabled={busy || aluno.situacao !== 'ativo' || aluno.email.endsWith('@cadastro.invalid')} onClick={() => void generate()}>{busy ? 'Preparando…' : 'Gerar convite de primeiro acesso'}</Button></>}
    {link && <div className="student-access-link"><p>Convite para <strong>{email}</strong>. Um convite novo invalida o anterior.</p><input readOnly aria-label="Convite privado do aluno" value={link} onFocus={event => event.currentTarget.select()}/><Button variant="secondary" onClick={() => void copy()}>{copied ? 'Link copiado' : 'Copiar link'}</Button><p className="helper">Um endereço 127.0.0.1 funciona somente neste computador. Para usar no celular, será necessário publicar a plataforma com HTTPS.</p></div>}
    {aluno.situacao !== 'ativo' && <p className="helper">Reative o cadastro para liberar o acesso.</p>}
  </section>;
}
