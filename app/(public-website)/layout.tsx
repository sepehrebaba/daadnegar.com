import { Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";
import { LoadingFallback } from "@/components/loading-fallback";

export default function daadnegarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <AppLayout>{children}</AppLayout>
      </Suspense>
      <Toaster />
    </>
  );
}
