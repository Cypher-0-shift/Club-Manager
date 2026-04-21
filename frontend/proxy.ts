// Simplified proxy — auth disabled for demo mode
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Auth disabled — all routes accessible
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
