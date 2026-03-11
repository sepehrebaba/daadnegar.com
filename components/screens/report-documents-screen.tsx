"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';

export function ReportDocumentsScreen() {
  const { navigate, setReportDocuments, goBack } = useApp();
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      console.log('[v0] User uploading documents:', files.length, 'files');
      const newDocs = Array.from(files).map(file => {
        // TODO: Upload to server and get URL
        const url = URL.createObjectURL(file);
        console.log('[v0] Document preview created:', file.name);
        return { name: file.name, url };
      });
      setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    console.log('[v0] Removing document at index:', index);
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (documents.length === 0) {
      setError('حداقل یک سند باید آپلود شود');
      return;
    }

    console.log('[v0] Setting report documents:', documents);
    setReportDocuments(documents.map(d => d.url));
    navigate('report-description');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-foreground">
            مرحله ۳: آپلود اسناد
          </CardTitle>
          <CardDescription>
            اسناد و مدارک مربوط به گزارش خود را آپلود کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <label className="cursor-pointer">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">
                کلیک کنید یا فایل‌ها را بکشید
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, تصویر یا سایر فرمت‌ها
              </p>
              <input
                type="file"
                accept="*/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                فایل‌های آپلود شده ({documents.length})
              </p>
              {documents.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                >
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{doc.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            ادامه
          </Button>

          <Button 
            onClick={goBack}
            variant="ghost"
            className="w-full"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
