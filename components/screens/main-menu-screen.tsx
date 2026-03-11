"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, FileText, ListChecks, ClipboardCheck, LogOut } from 'lucide-react';

export function MainMenuScreen() {
  const { navigate, state, goBack } = useApp();
  const user = state.user;

  // نمایش بخش تایید فقط برای کاربرانی که ۵ درخواست تایید شده دارند
  const showApprovalSection = user && user.approvedRequestsCount >= 5;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            منوی اصلی
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            به نجوا خوش آمدید
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: My Tokens');
              navigate('my-tokens');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="outline"
          >
            <Coins className="h-5 w-5" />
            توکن‌های من
            <span className="mr-auto bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
              {user?.tokensCount || 0}
            </span>
          </Button>
          
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: Report Case');
              navigate('report-step1');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="default"
          >
            <FileText className="h-5 w-5" />
            ثبت گزارش جدید
          </Button>
          
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: My Requests');
              navigate('my-requests');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="outline"
          >
            <ListChecks className="h-5 w-5" />
            درخواست‌های من
          </Button>

          {showApprovalSection && (
            <Button 
              onClick={() => {
                console.log('[v0] User clicked: Approval Wait List');
                navigate('approval-list');
              }}
              className="w-full py-6 text-base justify-start gap-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
              variant="outline"
            >
              <ClipboardCheck className="h-5 w-5" />
              لیست انتظار تایید
            </Button>
          )}

          <div className="border-t border-border my-2" />

          <Button 
            onClick={() => {
              console.log('[v0] User logging out');
              goBack();
            }}
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
