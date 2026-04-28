import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUser, setUser } from '@/lib/redis';
import type { StatItem } from '@/lib/redis';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    let body: { username?: string; password?: string; attributes?: StatItem[]; skills?: StatItem[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
    }

    const { username, password, attributes, skills } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e password obbligatori' }, { status: 400 });
    }

    const existing = await getUser(username);

    if (existing) {
      const valid = await bcrypt.compare(password, existing.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Password errata per questo username' }, { status: 401 });
      }
    }

    const passwordHash = existing
      ? existing.passwordHash
      : await bcrypt.hash(password, 10);

    await setUser(username, {
      passwordHash,
      attributes: attributes ?? [],
      skills: skills ?? [],
      updatedAt: new Date().toISOString(),
    });

    const action = existing ? 'aggiornata' : 'creata';
    return NextResponse.json({ ok: true, message: `Scheda ${action} per ${username}` });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
