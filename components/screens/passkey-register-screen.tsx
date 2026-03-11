"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Fingerprint } from 'lucide-react';

export function PasskeyRegisterScreen() {
  const { navigate, registerPasskey, setUser, goBack } = useApp();
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('[v0] User attempting to register passkey');

    if (passkey.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (passkey !== confirmPasskey) {
      setError('رمزهای عبور مطابقت ندارند');
      return;
    }

    setIsLoading(true);
    
    // شبیه‌سازی تاخیر شبکه
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('[v0] Registering passkey for new user');
    registerPasskey(passkey);
    
    // TODO: API call to activate user in DB
    console.log('[v0] Activating user in database');
    setUser({
      id: crypto.randomUUID(),
      passkey: passkey,
      inviteCode: 'INVITE2024',
      isActivated: true,
      tokensCount: 0,
      approvedRequestsCount: 0,
    });

    console.log('[v0] User activated successfully, redirecting to main menu');
    navigate('main-menu');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            ایجاد کلید امنیتی
          </CardTitle>
          <CardDescription>
            یک رمز عبور امن برای دسترسی به حساب خود ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey">رمز عبور</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="حداقل ۶ کاراکتر"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm">تکرار رمز عبور</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="رمز عبور را دوباره وارد کنید"
                value={confirmPasskey}
                onChange={(e) => setConfirmPasskey(e.target.value)}
                dir="ltr"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!passkey || !confirmPasskey || isLoading}
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت و ورود'}
            </Button>
            
            <Button 
              type="button"
              onClick={goBack}
              variant="ghost"
              className="w-full"
            >
              بازگشت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
