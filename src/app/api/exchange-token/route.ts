import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const secretKey = process.env.MONO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Missing required Mono environment variable: MONO_SECRET_KEY' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Mono auth code is required' },
        { status: 400 }
      );
    }

    const monoEnv = process.env.MONO_ENV || 'sandbox';
    const monoApiBaseUrl =
      monoEnv === 'live' || monoEnv === 'production'
        ? 'https://api.withmono.com'
        : 'https://api.withmono.com';

    const monoResponse = await fetch(`${monoApiBaseUrl}/v2/accounts/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
      body: JSON.stringify({ code }),
    });

    const data = await monoResponse.json();
    if (!monoResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to exchange Mono auth code', details: data },
        { status: monoResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to exchange Mono auth code';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
