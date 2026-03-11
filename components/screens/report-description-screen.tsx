"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export function ReportDescriptionScreen() {
  const { navigate, setReportDescription, goBack } = useApp();
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (description.length < 50) {
      setError('توضیحات باید حداقل ۵۰ کاراکتر باشد');
      return;
    }

    setIsLoading(true);
    console.log('[v0] Setting report description:', description.substring(0, 50) + '...');
    setReportDescription(description);
    
    // TODO: API call to save report in DB
    console.log('[v0] Saving report to database...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[v0] Report saved successfully');
    
    navigate('report-success');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            مرحله ۴: شرح مشکل
          </CardTitle>
          <CardDescription>
            توضیحات کاملی درباره گزارش خود بنویسید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              placeholder="لطفا جزئیات کامل گزارش خود را اینجا بنویسید..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-left" dir="ltr">
              {description.length} / 50+ characters
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'در حال ارسال...' : 'ارسال گزارش'}
          </Button>

          <Button 
            onClick={goBack}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
