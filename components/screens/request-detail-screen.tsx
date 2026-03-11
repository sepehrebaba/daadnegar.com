"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, User, FileText, Calendar } from 'lucide-react';
import type { RequestStatus } from '@/types';

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { label: 'در انتظار بررسی', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  accepted: { label: 'تایید شده', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'رد شده', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function RequestDetailScreen() {
  const { state, goBack } = useApp();
  const request = state.selectedRequest;

  if (!request) {
    console.log('[v0] No request selected, redirecting back');
    goBack();
    return null;
  }

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            جزئیات درخواست
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* وضعیت */}
          <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${status.bgColor}`}>
            <StatusIcon className={`h-6 w-6 ${status.color}`} />
            <span className={`font-medium ${status.color}`}>{status.label}</span>
          </div>

          {/* اطلاعات فرد */}
          <div className="bg-secondary p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {request.person.firstName} {request.person.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.person.isFamous ? 'فرد معروف' : 'ثبت دستی'}
                </div>
              </div>
            </div>
          </div>

          {/* تاریخ ثبت */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">تاریخ ثبت: </span>
              <span className="text-foreground">
                {new Date(request.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>

          {/* تعداد اسناد */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-muted-foreground">تعداد اسناد: </span>
              <span className="text-foreground">{request.documents.length} فایل</span>
            </div>
          </div>

          {/* توضیحات */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">شرح گزارش:</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {request.description}
            </p>
          </div>

          <Button 
            onClick={goBack}
            variant="outline"
            className="w-full"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
