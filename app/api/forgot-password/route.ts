import { NextRequest, NextResponse } from 'next/server';
import { getUser, createResetToken } from '@/lib/redis';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'Username obbligatorio' }, { status: 400 });
  }

  const user = await getUser(username);
  if (user) {
    const token = await createResetToken(username);
    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(resetUrl, username);
  }

  // Risposta generica indipendentemente dall'esistenza dell'utente, per non rivelare gli username registrati
  return NextResponse.json({ ok: true });
}
