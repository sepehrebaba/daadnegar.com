import { Providers } from "./providers";
import { AppLayout } from "@/components/app-layout";

export default function DadbanLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
    </Providers>
  );
}
