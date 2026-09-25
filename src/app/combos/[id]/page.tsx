import { notFound } from "next/navigation";

import ComboDetail from "@/app/combos/ui/ComboDetail";
import { getComboById } from "@/domain/combo/service";
import CommentArea from "@/components/comment/CommentArea";
import ViewedContentTracker from "@/features/recommend/view-history/ViewedContentTracker.client";
import { getContentPermissions } from "@/lib/auth/content-permissions";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function ComboDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const comboId = params.id;
  const supabase = await getServerSupabase();
  const combo = await getComboById(supabase, comboId);
  if (!combo) notFound();

  const commentLimit = 5;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const permissions = await getContentPermissions(supabase, user?.id, combo.writerUid);

  return (
    <main className="bg-white pb-20 pt-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 lg:px-8">
        <ViewedContentTracker sourceType="combo" sourceId={combo.id} />
        <ComboDetail combo={combo} {...permissions} />

        <CommentArea
          parentType="combo"
          parentId={combo.id}
          basePath={`/combos/${comboId}`}
          searchParams={searchParams}
          limit={commentLimit}
          showTitle
          className="border-t-0 pt-0"
        />
      </div>
    </main>
  );
}
