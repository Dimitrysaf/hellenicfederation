import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('authenticated');
  return NextResponse.json({ required: !isAuthenticated });
}
