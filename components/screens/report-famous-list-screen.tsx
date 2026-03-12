"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import type { Person } from "@/types";

export function ReportFamousListScreen() {
  const router = useRouter();
  const { getFamousPeople, setReportPerson } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [famousPeople, setFamousPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFamousPeople()
      .then(setFamousPeople)
      .finally(() => setLoading(false));
  }, [getFamousPeople]);

  const filteredPeople = famousPeople.filter((person) =>
    `${person.firstName} ${person.lastName}`.includes(searchQuery),
  );

  const handleSelectPerson = (person: Person) => {
    console.log("[v0] User selected famous person:", person);
    setReportPerson(person);
    router.push(routes.reportDocuments);
  };

  return (
    <div className="bg-background flex min-h-screen flex-col p-4">
      <Card className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-foreground text-center text-xl font-bold">
            انتخاب فرد معروف
          </CardTitle>
          <div className="relative mt-4">
            <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filteredPeople.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <p>فردی با این نام یافت نشد</p>
              <Button
                onClick={() => {
                  console.log("[v0] No person found, redirecting to manual entry");
                  router.push(routes.reportManual);
                }}
                variant="link"
                className="mt-2"
              >
                ورود دستی اطلاعات
              </Button>
            </div>
          ) : (
            filteredPeople.map((person) => (
              <Button
                key={person.id}
                onClick={() => handleSelectPerson(person)}
                variant="outline"
                className="w-full justify-start gap-3 py-4"
              >
                <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                  <User className="text-primary h-5 w-5" />
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {person.firstName} {person.lastName}
                  </div>
                </div>
              </Button>
            ))
          )}

          <Button onClick={() => router.back()} variant="ghost" className="mt-4">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
