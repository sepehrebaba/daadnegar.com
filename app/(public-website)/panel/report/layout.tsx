import { ReportProvider } from "@/context/report-context";

export default function ReportWizardLayout({ children }: { children: React.ReactNode }) {
  return <ReportProvider>{children}</ReportProvider>;
}
