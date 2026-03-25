import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  const host = process.env.API_HOST || '127.0.0.1';
  const port = process.env.API_PORT || '8000';
  return `http://${host}:${port}`;
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const backendUrl = getBackendUrl();

    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // Keep plain text if backend response is not JSON.
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        detail: 'Proxy login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
