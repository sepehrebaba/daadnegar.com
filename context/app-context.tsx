"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppState, AppScreen, Language, User, ReportCase, Person } from "@/types";
import { api } from "@/lib/edyen";

interface AppContextType {
  state: AppState;
  navigate: (screen: AppScreen) => void;
  setLanguage: (lang: Language) => void;
  registerPasskey: (passkey: string) => void;
  verifyPasskey: (passkey: string) => boolean;
  verifyInviteCode: (code: string) => boolean;
  setUser: (user: User | null) => void;
  startReport: () => void;
  updateReport: (data: Partial<ReportCase>) => void;
  setReportPerson: (person: Person) => void;
  setReportDocuments: (docs: string[]) => void;
  setReportDescription: (desc: string) => void;
  submitReport: () => void;
  selectRequest: (request: ReportCase) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  getFamousPeople: (search?: string) => Promise<Person[]>;
  getMyRequests: () => Promise<ReportCase[]>;
  getPendingRequests: () => Promise<ReportCase[]>;
  goBack: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const initialState: AppState = {
  currentScreen: "welcome",
  language: "fa",
  user: null,
  currentReport: null,
  selectedRequest: null,
};

// Screen history for back navigation
let screenHistory: AppScreen[] = ["welcome"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const navigate = useCallback((screen: AppScreen) => {
    console.log("[v0] Navigating to:", screen);
    screenHistory.push(screen);
    setState((prev) => ({ ...prev, currentScreen: screen }));
  }, []);

  const goBack = useCallback(() => {
    if (screenHistory.length > 1) {
      screenHistory.pop();
      const previousScreen = screenHistory[screenHistory.length - 1];
      console.log("[v0] Going back to:", previousScreen);
      setState((prev) => ({ ...prev, currentScreen: previousScreen }));
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    console.log("[v0] Language set to:", lang);
    setState((prev) => ({ ...prev, language: lang }));
  }, []);

  const registerPasskey = useCallback((passkey: string) => {
    console.log("[v0] Registering new passkey:", passkey);
    // TODO: API call to register passkey - currently stored in localStorage for demo
    localStorage.setItem("najva_passkey", passkey);
    console.log("[v0] Passkey registered successfully");
  }, []);

  const verifyPasskey = useCallback((passkey: string): boolean => {
    console.log("[v0] Verifying passkey:", passkey);
    // TODO: API call to verify passkey
    const storedPasskey = localStorage.getItem("najva_passkey");
    const isValid = storedPasskey === passkey;
    console.log("[v0] Passkey verification result:", isValid);
    return isValid;
  }, []);

  const verifyInviteCode = useCallback((code: string): boolean => {
    console.log("[v0] Verifying invite code:", code);
    // TODO: API call to verify invite code - test codes: INVITE2024, TEST123, DEMO456
    const validCodes = ["INVITE2024", "TEST123", "DEMO456"];
    const isValid = validCodes.includes(code.toUpperCase());
    console.log("[v0] Invite code verification result:", isValid);
    return isValid;
  }, []);

  const setUser = useCallback((user: User | null) => {
    console.log("[v0] Setting user:", user);
    // TODO: API call to save/update user
    setState((prev) => ({ ...prev, user }));
  }, []);

  const startReport = useCallback(() => {
    console.log("[v0] Starting new report");
    setState((prev) => ({ ...prev, currentReport: { id: crypto.randomUUID() } }));
  }, []);

  const updateReport = useCallback((data: Partial<ReportCase>) => {
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, ...data },
    }));
  }, []);

  const setReportPerson = useCallback((person: Person) => {
    console.log("[v0] Setting report person:", person);
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, person, personId: person.id },
    }));
  }, []);

  const setReportDocuments = useCallback((docs: string[]) => {
    console.log("[v0] Setting report documents:", docs);
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, documents: docs },
    }));
  }, []);

  const setReportDescription = useCallback((desc: string) => {
    console.log("[v0] Setting report description:", desc);
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, description: desc },
    }));
  }, []);

  const submitReport = useCallback(async () => {
    const report = state.currentReport;
    if (!report?.personId || !report?.description) return;
    const { data, error } = await api.reports.post({
      personId: report.personId,
      description: report.description,
      title: report.title,
      categoryId: report.categoryId,
      subcategoryId: report.subcategoryId,
      organizationType: report.organizationType,
      organizationName: report.organizationName,
      province: report.province,
      city: report.city,
      exactLocation: report.exactLocation,
      occurrenceFrequency: report.occurrenceFrequency,
      occurrenceDate: report.occurrenceDate?.toISOString(),
      hasEvidence: report.hasEvidence,
      evidenceTypes: report.evidenceTypes?.join(","),
      evidenceDescription: report.evidenceDescription,
      wantsContact: report.wantsContact,
      contactEmail: report.contactEmail,
      contactPhone: report.contactPhone,
      contactSocial: report.contactSocial,
      documents: (report.documents ?? []).map((url, i) =>
        typeof url === "string" ? { name: `doc-${i}`, url } : url,
      ),
    });
    if (error) throw new Error(String(error));
    setState((prev) => ({
      ...prev,
      currentReport: null,
      user: prev.user ? { ...prev.user, tokensCount: prev.user.tokensCount + 1 } : null,
    }));
  }, [state.currentReport]);

  const selectRequest = useCallback((request: ReportCase) => {
    setState((prev) => ({ ...prev, selectedRequest: request }));
  }, []);

  const approveRequest = useCallback(async (requestId: string) => {
    const { error } = await api.reports({ id: requestId }).approve.put();
    if (error) throw new Error(String(error));
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    const { error } = await api.reports({ id: requestId }).reject.put();
    if (error) throw new Error(String(error));
  }, []);

  const getFamousPeople = useCallback(async (search?: string) => {
    const { data, error } = await api.people.famous.get({ query: { search } });
    if (error) throw new Error(String(error));
    return (data ?? []) as Person[];
  }, []);

  const getMyRequests = useCallback(async () => {
    const { data, error } = await api.reports.my.get();
    if (error) throw new Error(String(error));
    return (data ?? []) as ReportCase[];
  }, []);

  const getPendingRequests = useCallback(async () => {
    const { data, error } = await api.reports.pending.get();
    if (error) throw new Error(String(error));
    return (data ?? []) as ReportCase[];
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        navigate,
        setLanguage,
        registerPasskey,
        verifyPasskey,
        verifyInviteCode,
        setUser,
        startReport,
        updateReport,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
