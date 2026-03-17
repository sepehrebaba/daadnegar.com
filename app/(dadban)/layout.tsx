import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";

export default function DadbanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppLayout>{children}</AppLayout>
      <Toaster />
    </>
  );
}
