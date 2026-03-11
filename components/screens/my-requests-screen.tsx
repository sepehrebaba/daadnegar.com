"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { RequestStatus } from '@/types';

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'در انتظار', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  accepted: { label: 'تایید شده', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  rejected: { label: 'رد شده', icon: XCircle, color: 'text-red-600 bg-red-100' },
};

export function MyRequestsScreen() {
  const { navigate, getMyRequests, selectRequest, goBack } = useApp();
  const requests = getMyRequests();

  const handleSelectRequest = (request: typeof requests[0]) => {
    console.log('[v0] User selected request:', request.id);
    selectRequest(request);
    navigate('request-detail');
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-background">
      <Card className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground text-center">
            درخواست‌های من
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>هیچ درخواستی ثبت نشده است</p>
            </div>
          ) : (
            requests.map(request => {
              const status = statusConfig[request.status];
              const StatusIcon = status.icon;
              
              return (
                <Button
                  key={request.id}
                  onClick={() => handleSelectRequest(request)}
                  variant="outline"
                  className="w-full justify-between py-6 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {request.person.firstName} {request.person.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                </Button>
              );
            })
          )}
          
          <Button 
            onClick={goBack}
            variant="ghost"
            className="mt-4"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
