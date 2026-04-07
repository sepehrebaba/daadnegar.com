"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/edyen";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import type { RequestStatus, ReportCase } from "@/types";
import { useTranslation } from "react-i18next";

export function MyRequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ReportCase[]>([]);
  const [loading, setLoading] = useState(true);

  const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; color: string }> =
    {
      pending: {
        label: t("requests.status.pending"),
        icon: Clock,
        color: "text-amber-600 bg-amber-100",
      },
      accepted: {
        label: t("requests.status.accepted"),
        icon: CheckCircle,
        color: "text-green-600 bg-green-100",
      },
      rejected: {
        label: t("requests.status.rejected"),
        icon: XCircle,
        color: "text-red-600 bg-red-100",
      },
    };

  useEffect(() => {
    api.reports.my
      .get()
      .then(({ data, error }) => {
        if (error) throw new Error(String(error));
        setRequests((data ?? []) as unknown as ReportCase[]);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectRequest = (request: (typeof requests)[0]) => {
    router.push(routes.requestDetail(request.id));
  };

  return (
    <div className="bg-background flex flex-col p-4">
      <Card className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-foreground text-center text-xl font-bold">
            {t("requests.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              {t("common.loading")}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              <FileText className="text-muted-foreground/40 mb-3 h-10 w-10" />
              <p className="text-muted-foreground/50 text-center text-lg font-bold">
                {t("requests.noRequests")}
              </p>
            </div>
          ) : (
            requests.map((request) => {
              const status = statusConfig[request.status];
              const StatusIcon = status.icon;

              return (
                <Button
                  key={request.id}
                  onClick={() => handleSelectRequest(request)}
                  variant="outline"
                  className="h-auto w-full justify-between py-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <FileText className="text-primary h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <div className="font-medium">
                        {request.person.firstName} {request.person.lastName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(request.createdAt).toLocaleDateString("fa-IR")}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${status.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                </Button>
              );
            })
          )}

          <Button onClick={() => router.back()} variant="ghost" className="mt-4">
            {t("common.back")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
