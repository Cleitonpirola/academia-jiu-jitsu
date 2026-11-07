export const VALIDADE_RECUPERACAO_MS = 15 * 60_000;
export const INTERVALO_RECUPERACAO_MS = 60_000;

export interface RecuperacaoSenha {
  id: string;
  tokenHash: string;
  email: string;
  credencialHash: string;
  solicitadoEm: string;
  expiraEm: string;
}

export interface EmailRecuperacao {
  origem: string;
  enviar(email: string, link: string): Promise<void>;
}

export function configurarEmailRecuperacao(env: NodeJS.ProcessEnv): EmailRecuperacao | null {
  const { RESEND_API_KEY: chave, RESEND_FROM: remetente, PASSWORD_RESET_ORIGIN: origem } = env;
  if (!chave || !remetente || !origem) return null;
  const url = new URL(origem);
  if (url.protocol !== 'https:' || url.origin !== origem || (env.APP_ORIGIN && env.APP_ORIGIN !== origem)) {
    throw new Error('PASSWORD_RESET_ORIGIN deve ser a mesma origem HTTPS do Tatame em APP_ORIGIN, sem caminho.');
  }
  return {
    origem,
    async enviar(email, link) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [email],
          subject: 'Redefinição de senha do Tatame',
          text: `Para escolher uma nova senha, abra este link em até 15 minutos:\n\n${link}\n\nSe você não pediu a alteração, ignore este e-mail.`,
        }),
        signal: AbortSignal.timeout(1200),
      });
      if (!response.ok) throw new Error('Serviço de e-mail indisponível.');
    },
  };
}
