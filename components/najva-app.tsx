"use client";

import { useApp } from '@/context/app-context';
import { StartScreen } from './screens/start-screen';
import { WelcomeScreen } from './screens/welcome-screen';
import { AboutScreen } from './screens/about-screen';
import { SecurityScreen } from './screens/security-screen';
import { InviteCodeScreen } from './screens/invite-code-screen';
import { PasskeyRegisterScreen } from './screens/passkey-register-screen';
import { PasskeyVerifyScreen } from './screens/passkey-verify-screen';
import { MainMenuScreen } from './screens/main-menu-screen';
import { MyTokensScreen } from './screens/my-tokens-screen';
import { ReportStep1Screen } from './screens/report-step1-screen';
import { ReportFamousListScreen } from './screens/report-famous-list-screen';
import { ReportManualEntryScreen } from './screens/report-manual-entry-screen';
import { ReportDocumentsScreen } from './screens/report-documents-screen';
import { ReportDescriptionScreen } from './screens/report-description-screen';
import { ReportSuccessScreen } from './screens/report-success-screen';
import { MyRequestsScreen } from './screens/my-requests-screen';
import { RequestDetailScreen } from './screens/request-detail-screen';
import { ApprovalListScreen } from './screens/approval-list-screen';

export function NajvaApp() {
  const { state } = useApp();

  const renderScreen = () => {
    console.log('[v0] Rendering screen:', state.currentScreen);
    
    switch (state.currentScreen) {
      case 'start':
      case 'language':
        return <StartScreen />;
      case 'welcome':
        return <WelcomeScreen />;
      case 'about':
        return <AboutScreen />;
      case 'security':
        return <SecurityScreen />;
      case 'invite-code':
        return <InviteCodeScreen />;
      case 'passkey-register':
        return <PasskeyRegisterScreen />;
      case 'passkey-verify':
        return <PasskeyVerifyScreen />;
      case 'main-menu':
        return <MainMenuScreen />;
      case 'my-tokens':
        return <MyTokensScreen />;
      case 'report-step1':
        return <ReportStep1Screen />;
      case 'report-famous-list':
        return <ReportFamousListScreen />;
      case 'report-manual-entry':
        return <ReportManualEntryScreen />;
      case 'report-documents':
        return <ReportDocumentsScreen />;
      case 'report-description':
        return <ReportDescriptionScreen />;
      case 'report-success':
        return <ReportSuccessScreen />;
      case 'my-requests':
        return <MyRequestsScreen />;
      case 'request-detail':
        return <RequestDetailScreen />;
      case 'approval-list':
        return <ApprovalListScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {renderScreen()}
    </main>
  );
}
