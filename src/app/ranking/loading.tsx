export default function RankingLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10" aria-busy="true">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="mx-auto h-10 w-52 animate-pulse rounded-lg bg-zinc-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-zinc-100">
            <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
            <div className="space-y-2 p-4">
              <div className="h-4 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">최근 7일 랭킹을 불러오는 중입니다.</span>
    </main>
  );
}
