import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { getUser } from '@/lib/redis';
import Roller from './components/Roller';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export default async function Page() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userData = await getUser(session.username);
  const charData = {
    attributes: userData?.attributes ?? [],
    skills: userData?.skills ?? [],
    updatedAt: userData?.updatedAt,
  };

  return <Roller username={session.username} initialData={charData} />;
}
