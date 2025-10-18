import Link from "next/link";

import * as userService from "@/features/user/service";
import ProfileForm from "@/features/user/ui/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await userService.getSelf();

  if (!me) {
    return (
      <main className="grid gap-4 p-6">
        <p>ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??</p>
        <Link href="/auth/signin-signup" className="text-primary underline">
          ë¡œê·¸?¸í•˜??ê°€ê¸?
        </Link>
      </main>
    );
  }

  return (
    <main className="grid gap-6 p-6">
      <section className="space-y-2">
        <h1 className="text-xl font-bold">ÇÁ·ÎÇÊ</h1>
        <div>?´ë©”?? {me.email ?? "-"}</div>
        <div>?´ë¦„: {me.display_name ?? "-"}</div>
      </section>
      <ProfileForm
        defaultName={me.display_name}
        defaultAvatar={me.photo_url}
        defaultEmail={me.email}
      />
    </main>
  );
}
