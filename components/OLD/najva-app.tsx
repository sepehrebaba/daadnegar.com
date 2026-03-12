"use client";

import { useApp } from "@/context/app-context";
import { StartScreen } from "./screens/start-screen";
import { WelcomeScreen } from "./screens/welcome-screen";
import { AboutScreen } from "./screens/about-screen";
import { SecurityScreen } from "./screens/security-screen";
import { InviteCodeScreen } from "./screens/invite-code-screen";
import { PasskeyRegisterScreen } from "./screens/passkey-register-screen";
import { PasskeyVerifyScreen } from "./screens/passkey-verify-screen";
import { MainMenuScreen } from "./screens/main-menu-screen";
import { MyTokensScreen } from "./screens/my-tokens-screen";
import { ReportCategoryScreen } from "./screens/report-category-screen";
import { ReportBasicInfoScreen } from "./screens/report-basic-info-screen";
import { ReportOrganizationScreen } from "./screens/report-organization-screen";
import { ReportPersonScreen } from "./screens/report-person-screen";
import { ReportLocationScreen } from "./screens/report-location-screen";
import { ReportOccurrenceScreen } from "./screens/report-occurrence-screen";
import { ReportEvidenceScreen } from "./screens/report-evidence-screen";
import { ReportContactScreen } from "./screens/report-contact-screen";
import { ReportConfirmationScreen } from "./screens/report-confirmation-screen";
import { ReportSuccessScreen } from "./screens/report-success-screen";
import { MyRequestsScreen } from "./screens/my-requests-screen";
import { RequestDetailScreen } from "./screens/request-detail-screen";
import { ApprovalListScreen } from "./screens/approval-list-screen";

export function NajvaApp() {
  const { state } = useApp();

  const renderScreen = () => {
    console.log("[v0] Rendering screen:", state.currentScreen);

    switch (state.currentScreen) {
      case "start":
      case "language":
        return <StartScreen />;
      case "welcome":
        return <WelcomeScreen />;
      case "about":
        return <AboutScreen />;
      case "security":
        return <SecurityScreen />;
      case "invite-code":
        return <InviteCodeScreen />;
      case "passkey-register":
        return <PasskeyRegisterScreen />;
      case "passkey-verify":
        return <PasskeyVerifyScreen />;
      case "main-menu":
        return <MainMenuScreen />;
      case "my-tokens":
        return <MyTokensScreen />;
      case "report-category":
        return <ReportCategoryScreen />;
      case "report-basic-info":
        return <ReportBasicInfoScreen />;
      case "report-organization":
        return <ReportOrganizationScreen />;
      case "report-person":
        return <ReportPersonScreen />;
      case "report-location":
        return <ReportLocationScreen />;
      case "report-occurrence":
        return <ReportOccurrenceScreen />;
      case "report-evidence":
        return <ReportEvidenceScreen />;
      case "report-contact":
        return <ReportContactScreen />;
      case "report-confirmation":
        return <ReportConfirmationScreen />;
      case "report-success":
        return <ReportSuccessScreen />;
      case "my-requests":
        return <MyRequestsScreen />;
      case "request-detail":
        return <RequestDetailScreen />;
      case "approval-list":
        return <ApprovalListScreen />;
      default:
        return <StartScreen />;
    }
  };

  return <main className="bg-background min-h-screen">{renderScreen()}</main>;
}
