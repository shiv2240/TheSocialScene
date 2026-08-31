import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Mobile OTP login is temporarily disabled. Please use email login.' },
    { status: 410 },
  );
}
