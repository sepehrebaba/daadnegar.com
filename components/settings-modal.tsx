import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SettingsForm } from "@/components/settings-form";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" showCloseButton={true}>
        <SettingsForm />
      </DialogContent>
    </Dialog>
  );
}
