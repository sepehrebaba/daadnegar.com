import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/screens/register-screen";
import { AppProvider } from "@/context/app-context";

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
    <AppProvider>
      <Suspense
        fallback={<div className="flex items-center justify-center p-4">در حال بارگذاری...</div>}
      >
        <RegisterScreen />
      </Suspense>
    </AppProvider>
  );
}
