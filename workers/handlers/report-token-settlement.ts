import { processReportTokenSettlement } from "@/server/lib/report-token-settlement";

export async function handleReportTokenSettlement(reportId: string): Promise<void> {
  if (!reportId) return;
  await processReportTokenSettlement(reportId);
}
