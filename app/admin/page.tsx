"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/edyen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const check = async () => {
      const { data, error } = await api.admin.categories.get();
      if (error) router.replace("/");
    };
    check();
  }, [router]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("adminDashboard.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("adminDashboard.welcome")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("adminDashboard.categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("adminDashboard.categoriesDescription")}
            </p>
            <a href="/admin/categories" className="text-primary hover:underline">
              {t("adminDashboard.viewArrow")}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("adminDashboard.users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("adminDashboard.usersDescription")}
            </p>
            <a href="/admin/users" className="text-primary hover:underline">
              {t("adminDashboard.viewArrow")}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("adminDashboard.people")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("adminDashboard.peopleDescription")}
            </p>
            <a href="/admin/people" className="text-primary hover:underline">
              {t("adminDashboard.viewArrow")}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("adminDashboard.reports")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("adminDashboard.reportsDescription")}
            </p>
            <a href="/admin/reports" className="text-primary hover:underline">
              {t("adminDashboard.viewArrow")}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("adminDashboard.auditLogs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("adminDashboard.auditLogsDescription")}
            </p>
            <a href="/admin/logs" className="text-primary hover:underline">
              {t("adminDashboard.viewArrow")}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
