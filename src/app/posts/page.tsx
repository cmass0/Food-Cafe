import Link from "next/link";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import PostList from "@/features/post/ui/PostList";
import { PaginationComponent} from "@/components/pagenation/pagenation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PostsPageProps = {
  searchParams?: {
    cursor?: string;
  };
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const supabase = getServerSupabase();
  const { items, nextCursor } = await postService.listPosts(supabase, {
    cursor: searchParams?.cursor,
  });

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold">게시글 목록</h1>
        <PostList posts={items} />
        {nextCursor ? (
          <div className="flex justify-end">
            <Link
              className="text-sm text-primary"
              href={`/posts?cursor=${encodeURIComponent(nextCursor)}`}
            >
              더 보기
            </Link>
          </div>
        ) : null}
      </main>
      <footer>
        <PaginationComponent />
      </footer>
    </>
  );
}
