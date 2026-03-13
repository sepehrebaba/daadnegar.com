import { Providers } from "./providers";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";

export default function DadbanLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
      <Toaster />
    </Providers>
  );
}
