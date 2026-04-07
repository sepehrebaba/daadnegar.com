import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/screens/register-screen";
import { LoadingFallback } from "@/components/loading-fallback";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code?.trim();
  if (!code) {
    redirect("/");
  }

  return (
    <Suspense fallback={<LoadingFallback className="flex items-center justify-center p-4" />}>
      <RegisterScreen />
    </Suspense>
  );
}
