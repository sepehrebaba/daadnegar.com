"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Users } from 'lucide-react';

export function ReportStep1Screen() {
  const { navigate, startReport, goBack } = useApp();

  const handleFamousPerson = () => {
    console.log('[v0] User selected: Famous person');
    startReport();
    navigate('report-famous-list');
  };

  const handleManualEntry = () => {
    console.log('[v0] User selected: Manual entry');
    startReport();
    navigate('report-manual-entry');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            مرحله ۱: انتخاب نوع فرد
          </CardTitle>
          <CardDescription>
            آیا گزارش شما درباره یک فرد معروف است؟
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            onClick={handleFamousPerson}
            className="w-full py-8 text-base flex-col gap-2 h-auto"
            variant="outline"
          >
            <Users className="h-8 w-8" />
            <span>بله، فرد معروف است</span>
            <span className="text-xs text-muted-foreground">انتخاب از لیست افراد</span>
          </Button>
          
          <Button 
            onClick={handleManualEntry}
            className="w-full py-8 text-base flex-col gap-2 h-auto"
            variant="outline"
          >
            <User className="h-8 w-8" />
            <span>خیر، وارد کردن دستی</span>
            <span className="text-xs text-muted-foreground">ورود اطلاعات فرد</span>
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
