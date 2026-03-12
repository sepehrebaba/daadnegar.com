"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import type { RequestStatus } from "@/types";

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "در انتظار", icon: Clock, color: "text-amber-600 bg-amber-100" },
  accepted: { label: "تایید شده", icon: CheckCircle, color: "text-green-600 bg-green-100" },
  rejected: { label: "رد شده", icon: XCircle, color: "text-red-600 bg-red-100" },
};

export function MyRequestsScreen() {
  const { navigate, getMyRequests, selectRequest, goBack } = useApp();
  const requests = getMyRequests();

  const handleSelectRequest = (request: (typeof requests)[0]) => {
    console.log("[v0] User selected request:", request.id);
    selectRequest(request);
    navigate("request-detail");
  };

  return (
    <div className="bg-background flex min-h-screen flex-col p-4">
      <Card className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-foreground text-center text-xl font-bold">
            درخواست‌های من
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <FileText className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
              <p>هیچ درخواستی ثبت نشده است</p>
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
                    <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                      <FileText className="text-primary h-5 w-5" />
                    </div>
                    <div className="text-right">
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

          <Button onClick={goBack} variant="ghost" className="mt-4">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
