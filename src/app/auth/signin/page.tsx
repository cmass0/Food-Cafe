import dynamic from "next/dynamic";

const AuthButtons = dynamic(() => import("@/features/user/ui/AuthButtons"), { ssr: false });

export default function SignInPage() {
  return (
    <main className="grid gap-4 p-6">
      <h1 className="text-xl font-bold">·Î±×ÀÎ</h1>
      <AuthButtons />
    </main>
  );
}

