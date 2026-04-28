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
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function getUser(username: string): Promise<UserRecord | null> {
  return getRedis().get<UserRecord>(`user:${username}`);
}

export async function setUser(username: string, data: UserRecord): Promise<void> {
  await getRedis().set(`user:${username}`, data);
}
