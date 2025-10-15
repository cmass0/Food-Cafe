import PostForm from "@/features/post/ui/PostForm";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold">새 게시글 작성</h1>
      <PostForm action={createPostAction} submitLabel="등록" />
    </main>
  );
}
