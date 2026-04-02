"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Log = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  user?: { id: string; name: string; username: string } | null;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page, perPage: 50 };
    if (entity) params.entity = entity;
    const { data } = await api.admin["audit-logs"].get(params);
    setLogs(data?.data ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entity]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">لاگ‌های حسابرسی</h1>
        <Input
          placeholder="فیلتر entity..."
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>لیست لاگ‌های حسابرسی</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>عملیات</TableHead>
                  <TableHead>موجودیت</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>
                      {l.entity}
                      {l.entityId && ` (${l.entityId.slice(0, 8)}...)`}
                    </TableCell>
                    <TableCell>{l.user ? `${l.user.name} (${l.user.username})` : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{l.details ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between">
              <span>
                صفحه {page} از {Math.ceil(total / 50) || 1}
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  قبلی
                </Button>
                <Button disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}>
                  بعدی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
