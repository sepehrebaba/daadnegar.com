"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, EyeOff, Lock } from 'lucide-react';

export function SecurityScreen() {
  const { goBack } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            سیاست‌های امنیتی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
            <EyeOff className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">بدون ردیابی</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ما هیچ‌گونه اطلاعات شخصی مانند IP، هدرها یا اطلاعات دستگاه شما را جمع‌آوری نمی‌کنیم.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
            <Lock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">رمزنگاری کامل</h3>
              <p className="text-sm text-muted-foreground mt-1">
                تمام ارتباطات و داده‌های شما با الگوریتم‌های پیشرفته رمزنگاری می‌شوند.
              </p>
            </div>
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
