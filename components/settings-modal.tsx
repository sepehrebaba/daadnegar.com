"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
};

export function SettingsModal({ open, onOpenChange, onLogout }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" showCloseButton={true}>
        <SettingsForm onLogout={onLogout} />
      </DialogContent>
    </Dialog>
  );
}
