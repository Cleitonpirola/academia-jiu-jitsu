import { useState } from 'react';
import type { Aluno } from '@tatame/shared';
import { Button, FormError } from '../components';
import { api } from '../lib';

export function AcessoAluno({ aluno }: { aluno: Aluno }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const generate = async () => {
    setBusy(true); setError(''); setLink(''); setCopied(false);
    try {
      const result = await api<{ token: string; email: string }>('/auth/alunos/' + aluno.id + '/convite', { method: 'POST' });
      setLink(window.location.origin + '/#ativar=' + result.token); setEmail(result.email);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { setError('Selecione e copie o link abaixo manualmente.'); }
  };
  return <section className="student-access"><h3>Área do aluno</h3><p className="helper">Gere um link para o aluno escolher ou redefinir a própria senha. Válido por 24 horas, para uso único. Envie apenas ao aluno correspondente.</p><FormError message={error}/><Button variant="secondary" disabled={busy || aluno.situacao !== 'ativo'} onClick={() => void generate()}>{busy ? 'Preparando…' : 'Gerar link de acesso'}</Button>{link && <div className="student-access-link"><p>Acesso para <strong>{email}</strong>. Um link novo invalida o anterior. Ao redefinir a senha, as sessões anteriores serão encerradas.</p><input readOnly aria-label="Link privado de acesso do aluno" value={link} onFocus={event => event.currentTarget.select()}/><Button variant="secondary" onClick={() => void copy()}>{copied ? 'Link copiado' : 'Copiar link'}</Button><p className="helper">Um endereço 127.0.0.1 funciona somente neste computador. Para usar no celular, será necessário publicar a plataforma com HTTPS.</p></div>}{aluno.situacao !== 'ativo' && <p className="helper">Reative o cadastro para liberar o acesso.</p>}</section>;
}
