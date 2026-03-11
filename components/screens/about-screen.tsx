"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function AboutScreen() {
  const { goBack } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            درباره نجوا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed text-justify">
            نجوا یک پلتفرم امن برای گزارش‌دهی است. ما به شما کمک می‌کنیم تا بتوانید 
            به صورت ناشناس و امن، گزارش‌های خود را ثبت کنید.
          </p>
          <p className="text-muted-foreground leading-relaxed text-justify">
            هدف ما ایجاد شفافیت و کمک به اجرای عدالت است. تمام اطلاعات شما 
            با بالاترین سطح امنیت محافظت می‌شود.
          </p>
          <Button 
            onClick={goBack}
            variant="outline"
            className="w-full mt-6"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
