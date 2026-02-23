import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const secretKey = process.env.MONO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Missing required Mono environment variable: MONO_SECRET_KEY' },
        { status: 500 }
      );
    }

    const monoEnv = process.env.MONO_ENV || 'sandbox';
    const monoApiBaseUrl =
      monoEnv === 'live' || monoEnv === 'production'
        ? 'https://api.withmono.com'
        : 'https://api.withmono.com';

    // Mono supports initiating a hosted account-linking session from the backend.
    const payload = {
      account: 'all',
      customer: {
        name: 'Expense Tracker User',
      },
      meta: {
        ref: `exp-${Date.now()}`,
      },
    };

    const monoResponse = await fetch(`${monoApiBaseUrl}/v2/accounts/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await monoResponse.json();
    if (!monoResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to start Mono linking', details: data },
        { status: monoResponse.status }
      );
    }

    return NextResponse.json({
      mono_url: data.mono_url || data.link || data.url || null,
      session_id: data.id || data.session_id || null,
      raw: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start Mono linking';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
