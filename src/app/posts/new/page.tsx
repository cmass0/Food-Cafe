import PostForm from "@/domain/post/ui/PostForm";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 md:px-8">
      <PostForm action={createPostAction} submitLabel="등록" />
    </main>
  );
}
