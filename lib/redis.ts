import { Redis } from '@upstash/redis';

export interface StatItem { name: string; score: number; max: number; }
export interface UserRecord {
  passwordHash: string;
  attributes: StatItem[];
  skills: StatItem[];
  updatedAt: string;
}
export interface CharacterData {
  attributes: StatItem[];
  skills: StatItem[];
  updatedAt?: string;
}

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.vampire_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.vampire_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('Redis non configurato su Vercel. Vai su Vercel Dashboard → Storage → Create → Upstash Redis → Connect to Project.');
  }
  return new Redis({ url, token });
}

export async function getUser(username: string): Promise<UserRecord | null> {
  return getRedis().get<UserRecord>(`user:${username}`);
}

export async function setUser(username: string, data: UserRecord): Promise<void> {
  await getRedis().set(`user:${username}`, data);
}
