import { assertPanelAccess } from "@/server/lib/assert-panel-access";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await assertPanelAccess();
  return children;
}
