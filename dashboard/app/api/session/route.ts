import { NextResponse } from 'next/server';
import { getDashboardAuth } from '@/lib/auth';

export async function GET() {
  const auth = await getDashboardAuth();
  if (!auth.user || !auth.role) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  return NextResponse.json({ role: auth.role, mustChangePassword: auth.mustChangePassword, user: { id: auth.user.id, email: auth.user.email } });
}
