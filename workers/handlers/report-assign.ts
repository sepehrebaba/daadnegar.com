import {
  assignReportFromQueue,
  scanAndReassignStaleReports,
} from "@/server/lib/report-validator-assignment";

export async function handleReportAssign(reportId: string): Promise<void> {
  console.log("[worker:report-assign] Starting assignment for reportId=%s", reportId);
  await assignReportFromQueue(reportId);
  console.log("[worker:report-assign] Finished assignment for reportId=%s", reportId);
}

export async function handleReportQueueStaleScan(): Promise<void> {
  console.log("[worker:stale-scan] Starting stale report scan...");
  const { slaReassigned, unassignedAssigned } = await scanAndReassignStaleReports();
  console.log(
    "[worker:stale-scan] Scan complete — slaReassigned=%d, unassignedAssigned=%d",
    slaReassigned,
    unassignedAssigned,
  );
}
