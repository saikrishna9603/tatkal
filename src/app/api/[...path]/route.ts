import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function forward(req: NextRequest, method: string, path: string[]) {
  try {
    const search = req.nextUrl.search || '';
    const targetPath = path.join('/');
    const targetUrl = `${getBackendUrl()}/api/${targetPath}${search}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const auth = req.headers.get('authorization');
    if (auth) {
      headers.Authorization = auth;
    }

    const bodyText = method === 'GET' || method === 'DELETE' ? undefined : await req.text();

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: bodyText,
      cache: 'no-store',
    });

    const raw = await response.text();
    let data: unknown = raw;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      // Keep non-JSON backend payload as-is.
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        detail: 'API proxy failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, 'GET', path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, 'POST', path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, 'PUT', path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, 'DELETE', path);
}
