import { ReportSearchValidatorGate } from "@/components/panel/report-search-validator-gate";
import { ReportSearchScreen } from "@/components/screens/report-search-screen";

export default function ReportSearchPage() {
  return (
    <ReportSearchValidatorGate>
      <ReportSearchScreen />
    </ReportSearchValidatorGate>
  );
}
