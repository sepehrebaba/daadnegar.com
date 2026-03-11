"use client";

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import type { Person } from '@/types';

export function ReportFamousListScreen() {
  const { navigate, getFamousPeople, setReportPerson, goBack } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  
  const famousPeople = getFamousPeople();
  
  const filteredPeople = famousPeople.filter(person => 
    `${person.firstName} ${person.lastName}`.includes(searchQuery)
  );

  const handleSelectPerson = (person: Person) => {
    console.log('[v0] User selected famous person:', person);
    setReportPerson(person);
    navigate('report-documents');
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-background">
      <Card className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground text-center">
            انتخاب فرد معروف
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {filteredPeople.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>فردی با این نام یافت نشد</p>
              <Button 
                onClick={() => {
                  console.log('[v0] No person found, redirecting to manual entry');
                  navigate('report-manual-entry');
                }}
                variant="link"
                className="mt-2"
              >
                ورود دستی اطلاعات
              </Button>
            </div>
          ) : (
            filteredPeople.map(person => (
              <Button
                key={person.id}
                onClick={() => handleSelectPerson(person)}
                variant="outline"
                className="w-full justify-start gap-3 py-4"
              >
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {person.firstName} {person.lastName}
                  </div>
                </div>
              </Button>
            ))
          )}
          
          <Button 
            onClick={goBack}
            variant="ghost"
            className="mt-4"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
