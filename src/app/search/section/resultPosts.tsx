import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PostListResult } from "@/domain/post/types";
import Link from "next/link";

type Props = {
  posts: PostListResult;
  searchParams: Record<string, string | string[] | undefined>;
};

export default function SearchResultPosts({ posts, searchParams }: Props) {
  const postitems = posts.items;
  const basePath = `${process.env.NEXT_PUBLIC_BASE_URL}/search`;
  const query = searchParams;
  const pageImtemCount = posts.limit;
  const total = posts.total;
  const currentPage = Number(query.page) ?? 1;

  function formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h2 className="font-bold text-xl mb-5">
          <Separator orientation="vertical" />
          커뮤니티
        </h2>
        {postitems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {postitems.map((post) => (
              <li key={post.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/posts/${post.id}`}
                  className="block hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <h3 className="font-semibold text-base truncate">{post.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-2 pl-4">{post.content}</p>
                </Link>
                <div className="flex items-center gap-3 text-xs text-gray-400 pl-4">
                  <Link
                    href={`/profile/${post.writerUid}`}
                    className="hover:text-blue-500 hover:underline transition-colors"
                  >
                    {post.writerName}
                  </Link>
                  <span>·</span>
                  <span>{formatTime(new Date(post.createdAt))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <PaginationComponent
        basePath={basePath}
        page={currentPage}
        pageItemSize={pageImtemCount}
        blockSize={5}
        total={total}
        query={query}
      />
    </Card>
  );
}
