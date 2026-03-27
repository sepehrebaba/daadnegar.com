import { reassignReportsFromDemotedValidator } from "@/server/lib/report-validator-assignment";

export async function handleValidatorDemoted(validatorId: string): Promise<void> {
  console.log("[worker:validator-demoted] Reassigning reports for validatorId=%s", validatorId);
  const reassigned = await reassignReportsFromDemotedValidator(validatorId);
  console.log(
    "[worker:validator-demoted] Done — reassigned %d slot(s) for validatorId=%s",
    reassigned,
    validatorId,
  );
}
