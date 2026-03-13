"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Check, X, ChevronRight, ChevronLeft, User } from "lucide-react";

export function ApprovalListScreen() {
  const router = useRouter();
  const { getPendingRequests, approveRequest, rejectRequest } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<
    Array<{
      id: string;
      person: { firstName: string; lastName: string };
      description: string;
      createdAt: Date | string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    getPendingRequests()
      .then(setPendingRequests)
      .catch(() => setPendingRequests([]))
      .finally(() => setLoading(false));
  }, [getPendingRequests]);
  const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = pendingRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId);
      setSelectedRequest(null);
      getPendingRequests().then(setPendingRequests);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      setSelectedRequest(null);
      getPendingRequests().then(setPendingRequests);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-background flex flex-col p-4">
      <Card className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-foreground text-center text-xl font-bold">
            لیست انتظار تایید
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            درخواست‌های در انتظار بررسی
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          {loading ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              در حال بارگذاری...
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              <FileText className="text-muted-foreground/40 mb-3 h-10 w-10" />
              <p className="text-muted-foreground/50 text-center text-lg font-bold">
                هیچ درخواستی در انتظار تایید نیست
              </p>
            </div>
          ) : (
            currentRequests.map((request) => (
              <div key={request.id} className="border-border overflow-hidden rounded-lg border">
                <div
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-4"
                  onClick={() =>
                    setSelectedRequest(selectedRequest === request.id ? null : request.id)
                  }
                >
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                    <User className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-foreground font-medium">
                      {request.person.firstName} {request.person.lastName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(request.createdAt).toLocaleDateString("fa-IR")}
                    </div>
                  </div>
                  <ChevronRight
                    className={`text-muted-foreground h-5 w-5 transition-transform ${
                      selectedRequest === request.id ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {selectedRequest === request.id && (
                  <div className="border-border bg-muted/30 space-y-3 border-t p-4">
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {request.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        تایید
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <X className="h-4 w-4" />
                        رد
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground text-sm">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button onClick={() => router.back()} variant="ghost" className="mt-auto">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
