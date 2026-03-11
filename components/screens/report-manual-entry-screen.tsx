"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, User } from 'lucide-react';

export function ReportManualEntryScreen() {
  const { navigate, setReportPerson, goBack } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[v0] User uploading person image:', file.name);
      // TODO: Upload to server and get URL
      setPersonImage(URL.createObjectURL(file));
      console.log('[v0] Person image preview created');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }

    console.log('[v0] Creating manual person entry:', { firstName, lastName, nationalCode });

    const person = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      nationalCode: nationalCode || undefined,
      imageUrl: personImage || undefined,
      isFamous: false,
    };

    setReportPerson(person);
    console.log('[v0] Person data set, moving to documents');
    navigate('report-documents');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            ورود اطلاعات فرد
          </CardTitle>
          <CardDescription>
            مشخصات فرد مورد نظر را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">نام *</Label>
              <Input
                id="firstName"
                placeholder="نام"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">نام خانوادگی *</Label>
              <Input
                id="lastName"
                placeholder="نام خانوادگی"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalCode">کد ملی (اختیاری)</Label>
              <Input
                id="nationalCode"
                placeholder="کد ملی ۱۰ رقمی"
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value)}
                dir="ltr"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>تصویر فرد (اختیاری)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {personImage ? (
                  <div className="space-y-2">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted">
                      <img 
                        src={personImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPersonImage(null)}
                    >
                      حذف تصویر
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      آپلود تصویر
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full">
              ادامه
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
