"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppState, AppScreen, Language, User, ReportCase, Person } from "@/types";
import {
  api,
  DAADNEGAR_INVITE_TOKEN_KEY,
  setInviteTokenStorage,
  clearInviteTokenStorage,
} from "@/lib/edyen";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

export type ValidateInviteResult =
  | { ok: true; token: string; hasPasskey: boolean }
  | { ok: false; error: string };

export type PasskeyResult = { ok: true; user: User } | { ok: false; error: string };

interface AppContextType {
  state: AppState;
  navigate: (screen: AppScreen) => void;
  setLanguage: (lang: Language) => void;
  validateInviteCode: (code: string) => Promise<ValidateInviteResult>;
  registerPasskey: (passkey: string) => Promise<PasskeyResult>;
  verifyPasskey: (passkey: string) => Promise<PasskeyResult>;
  setUser: (user: User | null) => void;
  startReport: () => void;
  updateReport: (data: Partial<ReportCase>) => void;
  setReportPerson: (person: Person) => void;
  setReportDocuments: (docs: string[]) => void;
  setReportDescription: (desc: string) => void;
  submitReport: () => Promise<{ tokensAwarded?: number } | undefined>;
  selectRequest: (request: ReportCase) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, rejectionReason: "problematic" | "false") => void;
  getFamousPeople: (search?: string) => Promise<Person[]>;
  getMyRequests: () => Promise<ReportCase[]>;
  getPendingRequests: () => Promise<ReportCase[]>;
  goBack: () => void;
  logout: () => Promise<void>;
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

  const validateInviteCode = useCallback(async (code: string): Promise<ValidateInviteResult> => {
    const { data, error } = await api.invite.validate.post({ code });
    if (error || !data) {
      return {
        ok: false,
        error: (error as Error)?.message ?? "کد دعوت نامعتبر است",
      };
    }
    if (!("ok" in data) || !data.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? "کد دعوت نامعتبر است",
      };
    }
    const { token, hasPasskey } = data;
    setInviteTokenStorage(token);
    return { ok: true, token, hasPasskey };
  }, []);

  const registerPasskey = useCallback(async (passkey: string): Promise<PasskeyResult> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) : null;
    if (!token) {
      return { ok: false, error: "لطفاً ابتدا کد دعوت را وارد کنید" };
    }
    const { data, error } = await api.invite.register.post({
      token,
      passkey,
    });
    if (error || !data) {
      return {
        ok: false,
        error: (error as Error)?.message ?? "خطا در ثبت رمز عبور",
      };
    }
    if (!("ok" in data) || !data.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? "خطا در ثبت رمز عبور",
      };
    }
    const user = (data as { user?: User }).user;
    if (!user) return { ok: false, error: "خطا در دریافت اطلاعات کاربر" };
    setState((prev) => ({ ...prev, user }));
    return { ok: true, user };
  }, []);

  const verifyPasskey = useCallback(async (passkey: string): Promise<PasskeyResult> => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) : null;
    if (!token) {
      return { ok: false, error: "لطفاً ابتدا کد دعوت را وارد کنید" };
    }
    const { data, error } = await api.invite.verify.post({ token, passkey });
    if (error || !data) {
      return {
        ok: false,
        error: (error as Error)?.message ?? "رمز عبور نادرست است",
      };
    }
    if (!("ok" in data) || !data.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? "رمز عبور نادرست است",
      };
    }
    const user = (data as { user?: User }).user;
    if (!user) return { ok: false, error: "خطا در دریافت اطلاعات کاربر" };
    setState((prev) => ({ ...prev, user }));
    return { ok: true, user };
  }, []);

  const setUser = useCallback((user: User | null) => {
    console.log("[v0] Setting user:", user);
    // TODO: API call to save/update user
    setState((prev) => ({ ...prev, user }));
  }, []);

  const startReport = useCallback(() => {
    console.log("[v0] Starting new report");
    setState((prev) => ({
      ...prev,
      currentReport: { id: crypto.randomUUID() },
    }));
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

  const submitReport = useCallback(async (): Promise<{ tokensAwarded?: number } | undefined> => {
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
    setState((prev) => ({ ...prev, currentReport: null }));
    // توکن‌های جدید (مثلاً invite_activity) توسط بک‌اند ثبت می‌شوند؛ کاربر را دوباره بارگذاری کن
    const { data: me } = await api.me.get();
    if (me) {
      const m = me as {
        tokensCount?: number;
        approvedRequestsCount?: number;
        mustChangePassword?: boolean;
      };
      setState((prev) => ({
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              tokensCount: m.tokensCount ?? 0,
              approvedRequestsCount: m.approvedRequestsCount ?? 0,
              mustChangePassword: m.mustChangePassword ?? prev.user.mustChangePassword,
            }
          : null,
      }));
    }
    return {
      tokensAwarded: (data as { tokensAwarded?: number })?.tokensAwarded,
    };
  }, [state.currentReport]);

  const selectRequest = useCallback((request: ReportCase) => {
    setState((prev) => ({ ...prev, selectedRequest: request }));
  }, []);

  const approveRequest = useCallback(async (requestId: string) => {
    const { error } = await api.reports({ id: requestId }).approve.put();
    if (error) throw new Error(String(error));
  }, []);

  const rejectRequest = useCallback(
    async (requestId: string, rejectionReason: "problematic" | "false") => {
      const { error } = await api.reports({ id: requestId }).reject.put({
        rejectionReason,
      });
      if (error) throw new Error(String(error));
    },
    [],
  );

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

  const logout = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) : null;
    if (token) {
      await fetch("/api/me/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    }
    await authClient.signOut();
    if (typeof window !== "undefined") {
      clearInviteTokenStorage();
      sessionStorage.setItem("daadnegar_logout_toast", "1");
    }
    setState((prev) => ({ ...prev, user: null }));
    window.location.href = routes.home;
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        navigate,
        setLanguage,
        registerPasskey,
        verifyPasskey,
        validateInviteCode,
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
        logout,
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
