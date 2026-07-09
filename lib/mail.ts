import { Resend } from 'resend';

const RECOVERY_EMAIL = process.env.RECOVERY_EMAIL || 'stefano.salvoni@gmail.com';

export async function sendPasswordResetEmail(resetUrl: string, username: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Vampire Roller <onboarding@resend.dev>',
    to: RECOVERY_EMAIL,
    subject: `Reset password — ${username}`,
    html: `<p>Richiesta di reset password per l'utente <b>${username}</b>.</p>
<p><a href="${resetUrl}">Clicca qui per impostare una nuova password</a></p>
<p>Il link scade tra 30 minuti. Se non hai richiesto tu il reset, ignora questa email.</p>`,
  });
}
