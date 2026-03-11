"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';

export function MyTokensScreen() {
  const { state, goBack } = useApp();
  const user = state.user;

  console.log('[v0] Displaying user tokens count:', user?.tokensCount);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            توکن‌های من
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {user?.tokensCount || 0}
            </div>
            <p className="text-muted-foreground">
              توکن فعال
            </p>
          </div>

          <div className="bg-secondary p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              با هر گزارش تایید شده، توکن دریافت می‌کنید.
              توکن‌ها امتیاز شما در سیستم را نشان می‌دهند.
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
