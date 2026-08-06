import { buildAuthModalPath } from "@/lib/auth/return-to";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Supabase가 세션을 갱신하며 발급한 쿠키를 로그인 안내 리다이렉트 응답에도 유지한다.
function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

// 글·레시피·조합 작성 및 수정 페이지에 진입하기 전 세션을 확인한다.
// 비로그인 사용자는 홈의 로그인 모달로 보내되, 로그인 뒤 돌아올 원래 경로(next)를 함께 보존한다.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("[proxy] Missing Supabase URL or anonymous key");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims() 호출 중 Supabase가 갱신한 세션 쿠키는 위 response에 반영된다.
  const { data } = await supabase.auth.getClaims();

  const isPageRequest = request.method === "GET" || request.method === "HEAD";
  if (!data?.claims.sub && isPageRequest) {
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const redirectUrl = new URL(buildAuthModalPath(next), request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  // 읽기 페이지와 API 요청에는 개입하지 않고, 보호가 필요한 작성·수정 화면에만 적용한다.
  matcher: [
    "/posts/new",
    "/posts/edit",
    "/recipes/new",
    "/recipes/edit",
    "/combos/new",
    "/combos/edit",
  ],
};
