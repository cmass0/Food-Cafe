import PostForm from "@/domain/post/ui/PostForm";
import { requirePageAuth } from "@/lib/auth/session";
import { createPostAction } from "../actions";

export default async function NewPostPage() {
  await requirePageAuth("/posts/new");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 md:px-8">
      <PostForm action={createPostAction} mode="create" cancelHref="/posts" />
    </main>
  );
}
