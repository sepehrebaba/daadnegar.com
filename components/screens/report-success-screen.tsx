"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function ReportSuccessScreen() {
  const { navigate, submitReport } = useApp();

  const handleBackToMenu = () => {
    console.log('[v0] Report submission complete');
    submitReport();
    console.log('[v0] User tokens count updated');
    console.log('[v0] Navigating back to main menu');
    navigate('main-menu');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            گزارش شما با موفقیت ثبت شد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              از همکاری شما سپاسگزاریم. گزارش شما توسط تیم ما بررسی خواهد شد 
              و نتیجه از طریق بخش «درخواست‌های من» قابل پیگیری است.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-center">
            <p className="text-sm text-primary font-medium">
              یک توکن به حساب شما اضافه شد!
            </p>
          </div>

          <Button 
            onClick={handleBackToMenu}
            className="w-full"
          >
            بازگشت به منوی اصلی
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
