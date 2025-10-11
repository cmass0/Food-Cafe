import Link from "next/link";

import * as userService from "@/features/user/service";
import ProfileForm from "@/features/user/ui/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await userService.getSelf();

  if (!me) {
    return (
      <main className="grid gap-4 p-6">
        <p>로그인이 필요합니다.</p>
        <Link href="/auth/signin" className="text-primary underline">
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="grid gap-6 p-6">
      <section className="space-y-2">
        <h1 className="text-xl font-bold">내 프로필</h1>
        <div>이메일: {me.email ?? "-"}</div>
        <div>이름: {me.display_name ?? "-"}</div>
      </section>
      <ProfileForm
        defaultName={me.display_name}
        defaultAvatar={me.photo_url}
        defaultEmail={me.email}
      />
    </main>
  );
}
