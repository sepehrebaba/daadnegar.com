"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

type PanelUser = { id: string; username: string; createdAt: Date | string };

export default function AdminPanelUsersPage() {
  const { t } = useTranslation();
  const [panelUsers, setPanelUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  const fetchPanelUsers = async () => {
    const { data } = await api.admin["panel-users"].get();
    setPanelUsers(data?.data ?? []);
  };

  useEffect(() => {
    fetchPanelUsers().finally(() => setLoading(false));
  }, []);

  const addPanelUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || newUser.password.length < 8) return;
    await api.admin["panel-users"].post({
      username: newUser.username,
      password: newUser.password,
    });
    setNewUser({ username: "", password: "" });
    setDialogOpen(false);
    fetchPanelUsers();
  };

  return (
    <div dir="rtl" className="text-right">
      <h1 className="mb-6 text-2xl font-bold">{t("adminPanelUsers.title")}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 space-x-4">
          <CardTitle>{t("adminPanelUsers.listTitle")}</CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="me-2 h-4 w-4" />
            {t("adminPanelUsers.addUser")}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">{t("adminPanelUsers.description")}</p>
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminPanelUsers.username")}</TableHead>
                  <TableHead className="text-right">{t("adminPanelUsers.createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panelUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-right" dir="ltr">
                      {u.username}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(u.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>{t("adminPanelUsers.addPanelUser")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={addPanelUser} className="space-y-4">
            <div>
              <Label>{t("adminPanelUsers.username")}</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value }))}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div>
              <Label>{t("adminPanelUsers.passwordLabel")}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                minLength={8}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="submit">{t("adminPanelUsers.add")}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
