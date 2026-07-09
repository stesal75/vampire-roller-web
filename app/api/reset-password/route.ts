import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUser, setUser, consumeResetToken } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token e nuova password obbligatori' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'Password troppo corta' }, { status: 400 });
  }

  const username = await consumeResetToken(token);
  if (!username) {
    return NextResponse.json({ error: 'Link scaduto o non valido' }, { status: 400 });
  }

  const existing = await getUser(username);
  if (!existing) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await setUser(username, {
    ...existing,
    passwordHash,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
