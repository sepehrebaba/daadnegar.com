"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ReportCase, Person, User } from "@/types";
import { api } from "@/lib/edyen";
import { useUser } from "@/context/user-context";

interface ReportContextType {
  currentReport: Partial<ReportCase> | null;
  startReport: () => void;
  updateReport: (data: Partial<ReportCase>) => void;
  setReportPerson: (person: Person) => void;
  setReportDescription: (desc: string) => void;
  submitReport: () => Promise<{ tokensAwarded?: number } | undefined>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [currentReport, setCurrentReport] = useState<Partial<ReportCase> | null>(null);
  const { user, setUser } = useUser();

  const startReport = useCallback(() => {
    setCurrentReport({ id: crypto.randomUUID() });
  }, []);

  const updateReport = useCallback((data: Partial<ReportCase>) => {
    setCurrentReport((prev) => ({ ...prev, ...data }));
  }, []);

  const setReportPerson = useCallback((person: Person) => {
    setCurrentReport((prev) => ({ ...prev, person, personId: person.id }));
  }, []);

  const setReportDescription = useCallback((desc: string) => {
    setCurrentReport((prev) => ({ ...prev, description: desc }));
  }, []);

  const submitReport = useCallback(async (): Promise<{ tokensAwarded?: number } | undefined> => {
    const report = currentReport;
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
      documents: (report.documents ?? []).map((doc, i) => ({
        name: (doc as { name?: string }).name ?? `doc-${i}`,
        url: (doc as { url?: string }).url ?? "",
      })),
    });
    if (error) throw new Error(String(error));

    setCurrentReport(null);

    const { data: me } = await api.me.get();
    if (me && user) {
      const fresh = me as Pick<
        User,
        "tokensCount" | "approvedRequestsCount" | "mustChangePassword"
      >;
      setUser({
        ...user,
        tokensCount: fresh.tokensCount ?? 0,
        approvedRequestsCount: fresh.approvedRequestsCount ?? 0,
        mustChangePassword: fresh.mustChangePassword ?? user.mustChangePassword,
      });
    }

    return { tokensAwarded: (data as { tokensAwarded?: number })?.tokensAwarded };
  }, [currentReport, user, setUser]);

  return (
    <ReportContext.Provider
      value={{
        currentReport,
        startReport,
        updateReport,
        setReportPerson,
        setReportDescription,
        submitReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) throw new Error("useReport must be used within ReportProvider");
  return context;
}
