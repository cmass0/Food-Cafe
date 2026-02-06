import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getComboById } from "@/domain/combo/service";
import CommentArea from "@/domain/comment/ui/CommentArea";
import ViewCount from "@/domain/view/ui/ViewCount.client";

import { CopyClipButton } from "@/lib/shareButton/copycliep";
import KakaoShareButton from "@/lib/shareButton/kakaosharebutton";
import { getServerSupabase } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";

import ComboDeleteButton from "../components/DeleteButton";
import ComboUpdateButton from "../components/UpdateButton";
import ComboLikeBookmarkButton from "../ui/likebookmarkButton";

function formatMinutes(value: number | null) {
  if (!value || value <= 0) return null;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}시간 ${minutes}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
}

export default async function ComboDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const comboId = params.id;
  const supabase = getServerSupabase();
  const combo = await getComboById(supabase, comboId);
  const currentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/combos/${comboId}`;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!combo) {
    notFound();
  }

  const timeLabel = formatMinutes(combo.timeMinutes);
  const tags = combo.tags.filter((tag) => typeof tag === "string" && tag.length > 0);
  const tools = combo.tools?.filter((tool) => tool.length > 0) ?? [];
  const steps = combo.steps?.map((step) => step.description) ?? [];
  const items = combo.items ?? [];
  const toolRequiredLabel = combo.toolRequired || tools.length > 0 ? "도구 필요" : "도구 필요 없음";
  const metaChips = [
    combo.difficulty ? `난이도 ${combo.difficulty}` : null,
    timeLabel ? `소요 ${timeLabel}` : null,
    toolRequiredLabel,
  ].filter(Boolean) as string[];

  const createdLabel = combo.createdAt.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
  const commentLimit = 5;

  return (
    <main className="relative overflow-hidden pt-24 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
            조합 레시피
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">조합 상세</h1>
          <p className="text-sm text-muted-foreground">
            조합의 핵심 포인트와 순서를 한눈에 확인하세요.
          </p>
        </header>

        {/* 레시피 상단 카드 섹션 시작 */}
        <section className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* 레시피이미지 */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40">
              {combo.image ? (
                <Image
                  src={combo.image}
                  alt={combo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  이미지가 없습니다.
                </div>
              )}
            </div>

            {/* 난이도/소요시간/도구여부 태그 및 좋아요, 북마크, 공유 버튼  */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-emerald-700">
                  {metaChips.map((chip) => (
                    <Badge
                      key={chip}
                      variant="outline"
                      className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2"></div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-slate-900">{combo.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {combo.writerName ?? "익명"} · {createdLabel} · 조회{" "}
                  <ViewCount type="combo" id={combo.id} initialCount={combo.viewCount ?? 0} />
                </p>
              </div>

              {/* 요약 정보 */}
              {combo.summary ? (
                <div className="rounded-2xl border border-emerald-100/70 bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    조합 포인트
                  </p>
                  <p className="whitespace-pre-line">{combo.summary}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">요약 정보가 없습니다.</p>
              )}

              {/* 태그 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">태그</p>
                <div className="flex flex-wrap gap-2">
                  {tags.length ? (
                    tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full border-emerald-200/80 bg-white text-emerald-700"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">태그가 없습니다.</span>
                  )}
                </div>
              </div>

              {/* 사용도구 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">사용 도구</p>
                <div className="flex flex-wrap gap-2">
                  {tools.length ? (
                    tools.map((tool) => (
                      <Badge
                        key={tool}
                        variant="outline"
                        className="rounded-full border-emerald-200/80 bg-white text-emerald-700"
                      >
                        {tool}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">도구가 없습니다.</span>
                  )}
                </div>
              </div>
              {/* 좋아요/북마크 & 수정/삭제 버튼 */}
              <div className="flex items-center justify-between  mt-5">
                <div>
                  <ComboLikeBookmarkButton combo={combo} />
                </div>
                {combo.writerUid === userId && (
                  <div className="flex gap-2">
                    <ComboUpdateButton id={combo.id} />
                    <ComboDeleteButton id={combo.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* 레시피 상단 카드 섹션 끝 */}

        {/* 조합 구성 섹션 시작*/}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">조합 구성</h2>
              <p className="text-sm text-muted-foreground">구성 아이템을 순서대로 확인하세요.</p>
            </div>
            <span className="text-xs text-muted-foreground">총 {items.length}개</span>
          </div>

          {items.length ? (
            <div className="space-y-6">
              {items.some((item) => item.type === "recipe") ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">레시피 구성</p>
                    <span className="text-xs text-muted-foreground">
                      {items.filter((item) => item.type === "recipe").length}개
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item, index) => {
                      if (item.type !== "recipe") return null;
                      const title = item.title || "레시피 이름 없음";
                      const summary = item.summary || "설명이 없습니다.";

                      return (
                        <Card
                          key={`${item.recipeid}-${index}`}
                          className="overflow-hidden rounded-2xl border  border-emerald-100/70 bg-white/80 shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row h-30 sm:items-stretch">
                            <div className="relative  w-full shrink-0 overflow-hidden bg-emerald-50/60 sm:h-auto sm:w-40 sm:self-stretch">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 160px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  이미지 없음
                                </div>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-start gap-2 p-4">
                              <div className="flex flex-wrap mb-3 items-center gap-2">
                                <h3 className="line-clamp-1 flex-1 text-base font-semibold text-slate-900">
                                  {title}
                                </h3>
                              </div>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {summary}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {items.some((item) => item.type === "product") ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">상품 구성</p>
                    <span className="text-xs text-muted-foreground">
                      {items.filter((item) => item.type === "product").length}개
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item, index) => {
                      if (item.type !== "product") return null;
                      const title = item.productName || "상품 이름 없음";
                      const summary = item.summary || "설명이 없습니다.";

                      return (
                        <Card
                          key={`${item.productName}-${index}`}
                          className="overflow-hidden rounded-2xl border border-emerald-100/70 bg-white/80 shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row h-30  sm:items-stretch">
                            <div className="relative h-32 w-full shrink-0 overflow-hidden bg-emerald-50/60 sm:h-auto sm:w-40 sm:self-stretch">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 160px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  이미지 없음
                                </div>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-start gap-2 p-4">
                              <div className="flex flex-wrap items-center mb-3 gap-2">
                                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                                  {title}
                                </h3>
                              </div>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {summary}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Card className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-emerald-200/70 bg-white/70 text-sm text-muted-foreground">
              등록된 조합 아이템이 없습니다.
            </Card>
          )}
        </section>
        {/* 조합 구성 섹션 끝*/}

        {/* 조리단계 섹션 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">조리 단계</h2>
          {steps.length ? (
            <div className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2 text-xs text-emerald-700">
                {combo.difficulty ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                  >
                    난이도 {combo.difficulty}
                  </Badge>
                ) : null}
                {timeLabel ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                  >
                    소요 {timeLabel}
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                >
                  {toolRequiredLabel}
                </Badge>
                {tools.length ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                  >
                    도구 {tools.length}개
                  </Badge>
                ) : null}
              </div>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li
                    key={`${index}-${step}`}
                    className="rounded-2xl border border-emerald-100/80 bg-emerald-50/40 px-4 py-3 text-sm leading-relaxed text-emerald-950"
                  >
                    <div className="mb-1 text-xs font-semibold text-emerald-700">
                      Step {index + 1}
                    </div>
                    <p className="whitespace-pre-line">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <Card className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-emerald-200/70 bg-white/70 text-sm text-muted-foreground">
              조리 단계가 없습니다.
            </Card>
          )}
        </section>

        {/* SNS 공유버튼 구현 */}
        <div className="flex justify-center items-start gap-4">
          <div className="flex flex-col  items-center gap-1">
            <KakaoShareButton
              contentinfo={{ title: combo.title, description: combo.summary }}
              imageUrl={combo.image || ""}
              url={currentUrl}
              label="카카오톡으로 공유"
              className="inline-flex cursor-pointer border-0 bg-transparent p-0 shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="text-xs text-slate-600">카카오톡으로 공유</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CopyClipButton currentUrl={currentUrl} />
            <span className="text-xs text-slate-600">URL 공유</span>
          </div>
        </div>

        <CommentArea
          parentType="combo"
          parentId={combo.id}
          basePath={`/combos/${comboId}`}
          searchParams={searchParams}
          limit={commentLimit}
        />
      </div>
    </main>
  );
}
