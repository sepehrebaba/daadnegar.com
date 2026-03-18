"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/edyen";
import { formatTimeAgo, toPersianNum } from "@/lib/utils";
import { DAADNEGAR_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  registration: "عضویت",
  report_approved: "تایید گزارش",
  report_false: "رد گزارش (اطلاعات نادرست)",
  report_problematic: "رد گزارش (مسئله‌دار)",
  invite_activity: "اولین گزارش (دعوت‌شده)",
};

type Transaction = {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
};

export function MyTokensScreen() {
  const router = useRouter();
  const { state, setUser } = useApp();
  const user = state.user;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // بارگذاری کاربر هنگام رفرش یا ورود مستقیم
  useEffect(() => {
    if (user) return;
    const hasAuth =
      typeof window !== "undefined" &&
      (localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) || document.cookie.includes("better-auth"));
    if (!hasAuth) return;
    let cancelled = false;
    api.me.get().then(({ data, error }) => {
      if (cancelled || error || !data) return;
      setUser({
        id: data.id,
        passkey: "",
        inviteCode: data.inviteCode ?? "",
        isActivated: true,
        tokensCount: data.tokensCount ?? 0,
        approvedRequestsCount: data.approvedRequestsCount ?? 0,
        role: data.role ?? "user",
      } as Parameters<typeof setUser>[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [user, setUser]);

  // بارگذاری تراکنش‌ها هنگام وجود کاربر
  useEffect(() => {
    if (!user?.id) return;
    setTransactionsLoading(true);
    api.me.transactions.get().then(({ data, error }) => {
      setTransactionsLoading(false);
      if (!error && Array.isArray(data)) setTransactions(data);
    });
  }, [user?.id]);

  return (
    <div className="bg-background flex flex-col items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <Coins className="text-primary h-10 w-10" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">توکن‌های من</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-primary mb-2 text-6xl font-black">
              {toPersianNum(user?.tokensCount ?? 0)}
            </div>
            <p className="text-muted-foreground">توکن فعال</p>
          </div>

          {/* لیست تراکنش‌ها */}
          <div className="bg-card border-border mt-6 w-full max-w-md overflow-hidden rounded-lg border">
            <div className="border-border border-b px-4 py-3">
              <h3 className="text-foreground font-bold">سابقه تراکنش‌ها</h3>
            </div>
            {transactionsLoading ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                در حال بارگذاری...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                تراکنشی ثبت نشده است
              </div>
            ) : (
              <ScrollArea viewportClassName="max-h-[280px]">
                <ul className="divide-border divide-y">
                  {transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {tx.amount > 0 ? (
                          <ArrowDownCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-500" />
                        )}
                        <span className="text-foreground truncate text-sm">
                          {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Use a badge */}
                        <span className="text-muted-foreground text-[10px]">
                          {formatTimeAgo(tx.createdAt)}
                        </span>
                        <Badge
                          variant={tx.amount > 0 ? "default" : "destructive"}
                          className="font-bold"
                        >
                          {tx.amount > 0 ? "+" : "-"}
                          {toPersianNum(Math.abs(tx.amount))}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          <div className="bg-secondary rounded-lg p-4">
            <div className="text-muted-foreground text-xs">
              <span className="text-foreground mb-1 block font-bold">سیستم امتیازدهی:</span>
              <ul className="list-inside list-disc">
                <li>
                  هر گزارش تایید شده: <span className="font-bold">+10</span> توکن
                </li>
                <li>
                  هر گزارش رد شده: <span className="font-bold">-5</span> توکن
                </li>
                <li>
                  هر گزارش مسئله‌دار: <span className="font-bold">-10</span> توکن
                </li>
                <li>
                  هر گزارش اطلاعات نادرست: <span className="font-bold">-10</span> توکن
                </li>
              </ul>
            </div>
          </div>

          <Button onClick={() => router.back()} variant="outline" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
