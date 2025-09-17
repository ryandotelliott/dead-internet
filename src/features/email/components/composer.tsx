import React, { useMemo, useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { PillInput } from "@/shared/components/ui/pill-input";

type Props = {
  initialRecipients: string[];
  isOpen: boolean;
  onClose: () => void;
};

export default function Composer({
  initialRecipients,
  isOpen,
  onClose,
}: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientEmails, setRecipientEmails] = useState<string[]>(
    () => initialRecipients ?? [],
  );

  const emailValidator = useMemo(() => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: string) => re.test(value);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 right-4 z-50 w-[520px] max-w-[92vw] rounded-md border-1 bg-background shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b-1 px-3 py-2 select-none">
        <p className="text-sm font-medium">New message</p>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close composer"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground select-none">
            To
          </Label>
          <div className="flex flex-row flex-wrap gap-1.5">
            <PillInput
              placeholder="Recipients"
              value={recipientEmails}
              onValueChange={setRecipientEmails}
              validator={(v) => emailValidator(v)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label
            htmlFor="composer-subject"
            className="text-xs text-muted-foreground select-none"
          >
            Subject
          </Label>
          <Input
            id="composer-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label
            htmlFor="composer-body"
            className="text-xs text-muted-foreground select-none"
          >
            Message
          </Label>
          <Textarea
            id="composer-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="min-h-52 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
