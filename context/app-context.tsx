"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { AppState, AppScreen, Language, User, ReportCase, Person } from "@/types";
import { api, getInviteToken, setInviteTokenStorage, clearInviteTokenStorage } from "@/lib/edyen";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

export type ValidateInviteResult =
  | { ok: true; token?: string; hasPasskey?: boolean }
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
  approveRequest: (requestId: string, comment: string) => Promise<void>;
  rejectRequest: (
    requestId: string,
    payload: {
      rejectionTier: "good_faith" | "bad_faith";
      rejectionCode: string;
      comment: string;
    },
  ) => Promise<void>;
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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const screenHistory = useRef<AppScreen[]>(["welcome"]);

  const navigate = useCallback((screen: AppScreen) => {
    screenHistory.current.push(screen);
    setState((prev) => ({ ...prev, currentScreen: screen }));
  }, []);

  const goBack = useCallback(() => {
    if (screenHistory.current.length > 1) {
      screenHistory.current.pop();
      const previousScreen = screenHistory.current[screenHistory.current.length - 1];
      setState((prev) => ({ ...prev, currentScreen: previousScreen }));
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
  }, []);

  const validateInviteCode = useCallback(async (code: string): Promise<ValidateInviteResult> => {
    const { data, error } = await api.invite.validate.post({ code });
    if (error || !data) {
      return { ok: false, error: extractErrorMessage(error, "کد دعوت نامعتبر است") };
    }
    const result = data as { ok?: boolean; error?: string; token?: string; hasPasskey?: boolean };
    if (!result.ok) {
      return { ok: false, error: result.error ?? "کد دعوت نامعتبر است" };
    }
    setInviteTokenStorage(result.token);
    return { ok: true, token: result.token, hasPasskey: result.hasPasskey };
  }, []);

  const registerPasskey = useCallback(async (passkey: string): Promise<PasskeyResult> => {
    const token = getInviteToken();
    if (!token) return { ok: false, error: "لطفاً ابتدا کد دعوت را وارد کنید" };

    const { data, error } = await api.invite.register.post({ token, passkey });
    if (error || !data) {
      return { ok: false, error: extractErrorMessage(error, "خطا در ثبت رمز عبور") };
    }
    const result = data as { ok?: boolean; error?: string; user?: User };
    if (!result.ok) return { ok: false, error: result.error ?? "خطا در ثبت رمز عبور" };
    if (!result.user) return { ok: false, error: "خطا در دریافت اطلاعات کاربر" };

    setState((prev) => ({ ...prev, user: result.user! }));
    return { ok: true, user: result.user };
  }, []);

  const verifyPasskey = useCallback(async (passkey: string): Promise<PasskeyResult> => {
    const token = getInviteToken();
    if (!token) return { ok: false, error: "لطفاً ابتدا کد دعوت را وارد کنید" };

    const { data, error } = await api.invite.verify.post({ token, passkey });
    if (error || !data) {
      return { ok: false, error: extractErrorMessage(error, "رمز عبور نادرست است") };
    }
    const result = data as { ok?: boolean; error?: string; user?: User };
    if (!result.ok) return { ok: false, error: result.error ?? "رمز عبور نادرست است" };
    if (!result.user) return { ok: false, error: "خطا در دریافت اطلاعات کاربر" };

    setState((prev) => ({ ...prev, user: result.user! }));
    return { ok: true, user: result.user };
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const startReport = useCallback(() => {
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
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, person, personId: person.id },
    }));
  }, []);

  const setReportDocuments = useCallback((docs: string[]) => {
    setState((prev) => ({
      ...prev,
      currentReport: { ...prev.currentReport, documents: docs },
    }));
  }, []);

  const setReportDescription = useCallback((desc: string) => {
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
      documents: (report.documents ?? []).map((url, i) => ({ name: `doc-${i}`, url })),
    });
    if (error) throw new Error(String(error));

    setState((prev) => ({ ...prev, currentReport: null }));

    const { data: me } = await api.me.get();
    if (me) {
      const { tokensCount, approvedRequestsCount, mustChangePassword } = me as Pick<
        User,
        "tokensCount" | "approvedRequestsCount" | "mustChangePassword"
      >;
      setState((prev) => ({
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              tokensCount: tokensCount ?? 0,
              approvedRequestsCount: approvedRequestsCount ?? 0,
              mustChangePassword: mustChangePassword ?? prev.user.mustChangePassword,
            }
          : null,
      }));
    }

    return { tokensAwarded: (data as { tokensAwarded?: number })?.tokensAwarded };
  }, [state.currentReport]);

  const selectRequest = useCallback((request: ReportCase) => {
    setState((prev) => ({ ...prev, selectedRequest: request }));
  }, []);

  const approveRequest = useCallback(async (requestId: string, comment: string) => {
    const { error } = await api.reports({ id: requestId }).approve.put({ comment });
    if (error) throw new Error(String(error));
  }, []);

  const rejectRequest = useCallback(
    async (
      requestId: string,
      payload: {
        rejectionTier: "good_faith" | "bad_faith";
        rejectionCode: string;
        comment: string;
      },
    ) => {
      const { error } = await api.reports({ id: requestId }).reject.put(payload);
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
    return data ?? [];
  }, []);

  const getPendingRequests = useCallback(async () => {
    const { data, error } = await api.reports.pending.get();
    if (error) throw new Error(String(error));
    return data ?? [];
  }, []);

  const logout = useCallback(async () => {
    const token = getInviteToken();
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
