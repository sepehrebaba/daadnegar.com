"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import Link from "next/link";

type Report = {
  id: string;
  title?: string | null;
  description: string;
  status: string;
  createdAt: string;
  person: { id: string; firstName: string; lastName: string };
  user: { id: string; name: string; email: string };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page, perPage: 25 };
    if (status) params.status = status;
    const { data } = await api.admin.reports.get(params);
    setReports(data?.data ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [page, status]);

  const updateStatus = async (
    id: string,
    newStatus: string,
    rejectionReason?: "false" | "problematic",
  ) => {
    await api.admin.reports({ id }).put({
      status: newStatus,
      ...(newStatus === "rejected" && rejectionReason && { rejectionReason }),
    });
    fetchReports();
  };

  const statusBadge = (s: string) => {
    const v = s === "accepted" ? "default" : s === "rejected" ? "destructive" : "secondary";
    const label = s === "accepted" ? "تأیید شده" : s === "rejected" ? "رد شده" : "در انتظار";
    return <Badge variant={v}>{label}</Badge>;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="accepted">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>لیست گزارش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شخص</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.person.firstName} {r.person.lastName}
                    </TableCell>
                    <TableCell>
                      {r.user.name}
                      <span className="text-muted-foreground text-sm"> ({r.user.email})</span>
                    </TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="xs" asChild>
                          <Link className="text-xs" href={`/admin/reports/${r.id}`}>
                            <Eye className="h-2 w-2" />
                            مشاهده
                          </Link>
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button size="xs" onClick={() => updateStatus(r.id, "accepted")}>
                              <Check className="h-2 w-2" />
                              <span>تایید</span>
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => updateStatus(r.id, "rejected")}
                            >
                              <X className="h-2 w-2" /> رد
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between">
              <span>
                صفحه {page} از {Math.ceil(total / 25) || 1}
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  قبلی
                </Button>
                <Button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>
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
