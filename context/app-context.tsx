"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppState, AppScreen, Language, User, ReportCase, Person, RequestStatus } from '@/types';

// داده‌های فرضی افراد معروف
const MOCK_FAMOUS_PEOPLE: Person[] = [
  { id: '1', firstName: 'علی', lastName: 'احمدی', isFamous: true },
  { id: '2', firstName: 'محمد', lastName: 'رضایی', isFamous: true },
  { id: '3', firstName: 'حسن', lastName: 'کریمی', isFamous: true },
  { id: '4', firstName: 'رضا', lastName: 'محمدی', isFamous: true },
  { id: '5', firstName: 'مهدی', lastName: 'حسینی', isFamous: true },
];

// داده‌های فرضی درخواست‌ها
const MOCK_REQUESTS: ReportCase[] = [
  {
    id: '1',
    userId: 'user1',
    personId: '1',
    person: MOCK_FAMOUS_PEOPLE[0],
    documents: ['doc1.pdf'],
    description: 'توضیحات گزارش اول',
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    personId: '2',
    person: MOCK_FAMOUS_PEOPLE[1],
    documents: ['doc2.pdf'],
    description: 'توضیحات گزارش دوم',
    status: 'accepted',
    createdAt: new Date(),
  },
];

interface AppContextType {
  state: AppState;
  navigate: (screen: AppScreen) => void;
  setLanguage: (lang: Language) => void;
  registerPasskey: (passkey: string) => void;
  verifyPasskey: (passkey: string) => boolean;
  verifyInviteCode: (code: string) => boolean;
  setUser: (user: User | null) => void;
  startReport: () => void;
  setReportPerson: (person: Person) => void;
  setReportDocuments: (docs: string[]) => void;
  setReportDescription: (desc: string) => void;
  submitReport: () => void;
  selectRequest: (request: ReportCase) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  getFamousPeople: () => Person[];
  getMyRequests: () => ReportCase[];
  getPendingRequests: () => ReportCase[];
  goBack: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const initialState: AppState = {
  currentScreen: 'start',
  language: 'fa',
  user: null,
  currentReport: null,
  selectedRequest: null,
};

// ذخیره تاریخچه صفحات برای دکمه بازگشت
let screenHistory: AppScreen[] = ['start'];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // ناوبری بین صفحات
  const navigate = useCallback((screen: AppScreen) => {
    console.log('[v0] Navigating to:', screen);
    screenHistory.push(screen);
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  // بازگشت به صفحه قبل
  const goBack = useCallback(() => {
    if (screenHistory.length > 1) {
      screenHistory.pop();
      const previousScreen = screenHistory[screenHistory.length - 1];
      console.log('[v0] Going back to:', previousScreen);
      setState(prev => ({ ...prev, currentScreen: previousScreen }));
    }
  }, []);

  // تنظیم زبان
  const setLanguage = useCallback((lang: Language) => {
    console.log('[v0] Language set to:', lang);
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  // ثبت Passkey جدید
  const registerPasskey = useCallback((passkey: string) => {
    console.log('[v0] Registering new passkey:', passkey);
    // TODO: API call to register passkey
    // در اینجا passkey در localStorage ذخیره می‌شود (برای دمو)
    localStorage.setItem('najva_passkey', passkey);
    console.log('[v0] Passkey registered successfully');
  }, []);

  // تایید Passkey
  const verifyPasskey = useCallback((passkey: string): boolean => {
    console.log('[v0] Verifying passkey:', passkey);
    // TODO: API call to verify passkey
    const storedPasskey = localStorage.getItem('najva_passkey');
    const isValid = storedPasskey === passkey;
    console.log('[v0] Passkey verification result:', isValid);
    return isValid;
  }, []);

  // تایید کد دعوت
  const verifyInviteCode = useCallback((code: string): boolean => {
    console.log('[v0] Verifying invite code:', code);
    // TODO: API call to verify invite code
    // کد فعلی برای تست: INVITE2024
    const validCodes = ['INVITE2024', 'TEST123', 'DEMO456'];
    const isValid = validCodes.includes(code.toUpperCase());
    console.log('[v0] Invite code verification result:', isValid);
    return isValid;
  }, []);

  // تنظیم کاربر
  const setUser = useCallback((user: User | null) => {
    console.log('[v0] Setting user:', user);
    // TODO: API call to save/update user
    setState(prev => ({ ...prev, user }));
  }, []);

  // شروع گزارش جدید
  const startReport = useCallback(() => {
    console.log('[v0] Starting new report');
    setState(prev => ({ ...prev, currentReport: { id: crypto.randomUUID() } }));
  }, []);

  // تنظیم فرد گزارش
  const setReportPerson = useCallback((person: Person) => {
    console.log('[v0] Setting report person:', person);
    setState(prev => ({
      ...prev,
      currentReport: { ...prev.currentReport, person, personId: person.id }
    }));
  }, []);

  // تنظیم مدارک گزارش
  const setReportDocuments = useCallback((docs: string[]) => {
    console.log('[v0] Setting report documents:', docs);
    setState(prev => ({
      ...prev,
      currentReport: { ...prev.currentReport, documents: docs }
    }));
  }, []);

  // تنظیم توضیحات گزارش
  const setReportDescription = useCallback((desc: string) => {
    console.log('[v0] Setting report description:', desc);
    setState(prev => ({
      ...prev,
      currentReport: { ...prev.currentReport, description: desc }
    }));
  }, []);

  // ارسال گزارش
  const submitReport = useCallback(() => {
    console.log('[v0] Submitting report:', state.currentReport);
    // TODO: API call to save report in DB
    // TODO: Log report submission
    console.log('[v0] Report submitted successfully');
    console.log('[v0] Updating user requests count');
    setState(prev => ({
      ...prev,
      currentReport: null,
      user: prev.user ? { ...prev.user, tokensCount: prev.user.tokensCount + 1 } : null
    }));
  }, [state.currentReport]);

  // انتخاب درخواست برای مشاهده جزئیات
  const selectRequest = useCallback((request: ReportCase) => {
    console.log('[v0] Selecting request:', request);
    setState(prev => ({ ...prev, selectedRequest: request }));
  }, []);

  // تایید درخواست
  const approveRequest = useCallback((requestId: string) => {
    console.log('[v0] Approving request:', requestId);
    // TODO: API call to approve request
    console.log('[v0] Request approved successfully');
  }, []);

  // رد درخواست
  const rejectRequest = useCallback((requestId: string) => {
    console.log('[v0] Rejecting request:', requestId);
    // TODO: API call to reject request
    console.log('[v0] Request rejected successfully');
  }, []);

  // دریافت لیست افراد معروف
  const getFamousPeople = useCallback(() => {
    console.log('[v0] Fetching famous people list');
    // TODO: API call to get famous people
    return MOCK_FAMOUS_PEOPLE;
  }, []);

  // دریافت درخواست‌های کاربر
  const getMyRequests = useCallback(() => {
    console.log('[v0] Fetching user requests');
    // TODO: API call to get user requests
    return MOCK_REQUESTS;
  }, []);

  // دریافت درخواست‌های در انتظار تایید
  const getPendingRequests = useCallback(() => {
    console.log('[v0] Fetching pending requests for approval');
    // TODO: API call to get pending requests
    return MOCK_REQUESTS.filter(r => r.status === 'pending');
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      navigate,
      setLanguage,
      registerPasskey,
      verifyPasskey,
      verifyInviteCode,
      setUser,
      startReport,
      setReportPerson,
      setReportDocuments,
      setReportDescription,
      submitReport,
      selectRequest,
      approveRequest,
      rejectRequest,
      getFamousPeople,
      getMyRequests,
      getPendingRequests,
      goBack,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
