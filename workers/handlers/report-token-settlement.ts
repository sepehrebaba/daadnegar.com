import { processReportTokenSettlement } from "@/server/lib/report-token-settlement";

export async function handleReportTokenSettlement(reportId: string): Promise<void> {
  if (!reportId) {
    console.warn("[worker:token-settlement] Received empty reportId, skipping");
    return;
  }
  console.log("[worker:token-settlement] Starting settlement for reportId=%s", reportId);
  await processReportTokenSettlement(reportId);
  console.log("[worker:token-settlement] Finished settlement for reportId=%s", reportId);
}
