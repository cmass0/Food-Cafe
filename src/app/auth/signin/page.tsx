import dynamic from "next/dynamic";

const AuthButtons = dynamic(() => import("@/features/user/ui/AuthButtons"), { ssr: false });

export default function SignInPage() {
  return (
    <main className="grid gap-4 p-6">
      <h1 className="text-xl font-bold">?뚯썝媛?낆엯</h1>
      <AuthButtons />
    </main>
  );
}


