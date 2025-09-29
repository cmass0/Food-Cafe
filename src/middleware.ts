import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No-op middleware: 현재는 아무 것도 하지 않고 그대로 통과합니다.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// 필요 시 특정 경로에만 적용하도록 matcher를 설정할 수 있습니다.
// export const config = { matcher: ['/recipes/:path*'] };
