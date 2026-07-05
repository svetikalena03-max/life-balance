import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceDayContent } from "@/components/VoiceDayContent";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useEffect } from "react";

export function VoiceDayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { abort } = useSpeechRecognition();

  useEffect(() => {
    if (!open) abort();
  }, [open, abort]);

  const handleOpenChange = (next: boolean) => {
    if (!next) abort();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Расскажите о своём дне</DialogTitle>
          <DialogDescription>
            Надиктуйте или напишите одной фразой, что было за день. AI извлечёт данные автоматически.
          </DialogDescription>
        </DialogHeader>
        {open && <VoiceDayContent />}
      </DialogContent>
    </Dialog>
  );
}
