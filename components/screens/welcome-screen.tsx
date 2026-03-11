"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, HelpCircle, KeyRound } from 'lucide-react';

export function WelcomeScreen() {
  const { navigate, goBack } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            به ربات نجوا خوش آمدید
          </CardTitle>
          <CardDescription className="text-base mt-2">
            ما اینجا هستیم تا مطمئن شویم هیچ‌کس از عدالت فرار نمی‌کند
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: What we do?');
              navigate('about');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="outline"
          >
            <HelpCircle className="h-5 w-5" />
            ما چه کاری انجام می‌دهیم؟
          </Button>
          
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: Security concerns');
              navigate('security');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="outline"
          >
            <Shield className="h-5 w-5" />
            نگرانی‌های امنیتی
          </Button>
          
          <Button 
            onClick={() => {
              console.log('[v0] User clicked: Enter invitation code');
              navigate('invite-code');
            }}
            className="w-full py-6 text-base justify-start gap-3"
            variant="default"
          >
            <KeyRound className="h-5 w-5" />
            وارد کردن کد دعوت
          </Button>

          <Button 
            onClick={goBack}
            variant="ghost"
            className="mt-2"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
