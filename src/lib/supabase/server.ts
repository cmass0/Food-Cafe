// PURPOSE: 서버 액션/Route Handler/Server Component 용 Supabase 클라이언트 스켈레톤
// NOTE: 구현은 추후 진행. 여기서는 파일 구조만 생성합니다.
// - 쿠키 기반 세션 전파(createServerClient) 예정
// - 변이(INSERT/UPDATE/DELETE)는 서버에서만 실행 원칙

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export function getMiddlewareSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

