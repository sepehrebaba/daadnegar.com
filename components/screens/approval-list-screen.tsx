"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Check, X, ChevronRight, ChevronLeft, User } from 'lucide-react';

export function ApprovalListScreen() {
  const { getPendingRequests, approveRequest, rejectRequest, goBack } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const itemsPerPage = 5;

  const pendingRequests = getPendingRequests();
  const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = pendingRequests.slice(startIndex, startIndex + itemsPerPage);

  const handleApprove = (requestId: string) => {
    console.log('[v0] Approving request:', requestId);
    approveRequest(requestId);
    setSelectedRequest(null);
    // TODO: Refresh list after approval
  };

  const handleReject = (requestId: string) => {
    console.log('[v0] Rejecting request:', requestId);
    rejectRequest(requestId);
    setSelectedRequest(null);
    // TODO: Refresh list after rejection
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-background">
      <Card className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground text-center">
            لیست انتظار تایید
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            درخواست‌های در انتظار بررسی
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          {currentRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>هیچ درخواستی در انتظار تایید نیست</p>
            </div>
          ) : (
            currentRequests.map(request => (
              <div key={request.id} className="border border-border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRequest(
                    selectedRequest === request.id ? null : request.id
                  )}
                >
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {request.person.firstName} {request.person.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                    selectedRequest === request.id ? 'rotate-90' : ''
                  }`} />
                </div>
                
                {selectedRequest === request.id && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {request.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
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
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button 
            onClick={goBack}
            variant="ghost"
            className="mt-auto"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
