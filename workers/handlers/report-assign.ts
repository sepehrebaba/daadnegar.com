import {
  assignReportFromQueue,
  scanAndReassignStaleReports,
} from "@/server/lib/report-validator-assignment";

export async function handleReportAssign(reportId: string): Promise<void> {
  await assignReportFromQueue(reportId);
}

export async function handleReportQueueStaleScan(): Promise<void> {
  const { slaReassigned, unassignedAssigned } = await scanAndReassignStaleReports();
  if (slaReassigned > 0 || unassignedAssigned > 0) {
    console.info("[worker] stale scan:", { slaReassigned, unassignedAssigned });
  }
}
