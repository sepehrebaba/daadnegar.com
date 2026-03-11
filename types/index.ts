// تایپ‌های پروژه نجوا

export type Language = 'fa' | 'en';

export type AppScreen = 
  | 'start'
  | 'language'
  | 'welcome'
  | 'about'
  | 'security'
  | 'invite-code'
  | 'passkey-register'
  | 'passkey-verify'
  | 'main-menu'
  | 'my-tokens'
  | 'report-step1'
  | 'report-famous-list'
  | 'report-manual-entry'
  | 'report-documents'
  | 'report-description'
  | 'report-success'
  | 'my-requests'
  | 'request-detail'
  | 'approval-list'
  | 'error';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  passkey: string;
  inviteCode: string;
  isActivated: boolean;
  tokensCount: number;
  approvedRequestsCount: number;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nationalCode?: string;
  imageUrl?: string;
  isFamous: boolean;
}

export interface ReportCase {
  id: string;
  userId: string;
  personId: string;
  person: Person;
  documents: string[];
  description: string;
  status: RequestStatus;
  createdAt: Date;
}

export interface AppState {
  currentScreen: AppScreen;
  language: Language;
  user: User | null;
  currentReport: Partial<ReportCase> | null;
  selectedRequest: ReportCase | null;
}
