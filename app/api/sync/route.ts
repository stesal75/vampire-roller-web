import { NextRequest, NextResponse } from 'next/server';

interface StatItem { name: string; score: number; max: number; }
interface CharacterData { attributes: StatItem[]; skills: StatItem[]; updatedAt?: string; }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-sync-secret',
};

// Fallback in-memory per sviluppo locale senza Redis
let memStore: CharacterData | null = null;

function hasRedis() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisGet(): Promise<CharacterData | null> {
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redis.get<CharacterData>('character');
}

async function redisSet(data: CharacterData): Promise<void> {
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.set('character', data);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const data = hasRedis()
    ? (await redisGet() ?? { attributes: [], skills: [] })
    : (memStore ?? { attributes: [], skills: [] });
  return NextResponse.json(data, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (secret && req.headers.get('x-sync-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const body = await req.json() as CharacterData;
  const data: CharacterData = {
    attributes: body.attributes ?? [],
    skills: body.skills ?? [],
    updatedAt: new Date().toISOString(),
  };

  if (hasRedis()) {
    await redisSet(data);
  } else {
    memStore = data;
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
