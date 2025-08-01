import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { code } = await request.json();
  const secret = process.env.TWO_FACTOR_AUTH_SECRET;

  console.log('Received code:', code);
  console.log('Using secret:', secret);

  if (!secret) {
    return NextResponse.json({ message: '2FA secret not configured' }, { status: 500 });
  }

  const isValid = authenticator.check(code, secret);

  if (isValid) {
    // Set a secure, HTTP-only cookie to mark the session as authenticated
    const cookieStore = await cookies();
    cookieStore.set('authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    return NextResponse.json({ message: '2FA code valid' });
  } else {
    return NextResponse.json({ message: 'Μη έγκυρος κωδικός 2FA' }, { status: 401 });
  }
}
