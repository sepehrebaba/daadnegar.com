import { Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";

export default function daadnegarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">در حال بارگذاری...</div>
        }
      >
        <AppLayout>{children}</AppLayout>
      </Suspense>
      <Toaster />
    </>
  );
}
