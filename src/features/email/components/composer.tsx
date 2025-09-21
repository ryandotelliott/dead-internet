"use client";

import React, { useEffect, useMemo } from "react";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { PillInput } from "@/shared/components/ui/pill-input";
import { useEmailStore } from "@/features/email/state/store";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useShallow } from "zustand/react/shallow";

type Props = {
  initialRecipients: string[];
};

export default function Composer({ initialRecipients }: Props) {
  const { isComposerOpen, recipients, subject, body } = useEmailStore(
    useShallow((s) => ({
      isComposerOpen: s.isComposerOpen,
      recipients: s.recipients,
      subject: s.subject,
      body: s.body,
    })),
  );

  const { resetComposer, setRecipients, setSubject, setBody } = useEmailStore(
    useShallow((s) => ({
      resetComposer: s.resetComposer,
      setRecipients: s.setRecipients,
      setSubject: s.setSubject,
      setBody: s.setBody,
    })),
  );
  const sendEmail = useMutation(api.email.emails.sendEmail);

  useEffect(() => {
    if (isComposerOpen) {
      if (initialRecipients && initialRecipients.length > 0) {
        setRecipients(initialRecipients);
      }
    }
  }, [isComposerOpen, initialRecipients, setRecipients]);

  const emailValidator = useMemo(() => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: string) => re.test(value);
  }, []);

  if (!isComposerOpen) return null;

  return (
    <div className="absolute bottom-4 right-4 z-50 w-[520px] max-w-[92vw] rounded-md border-1 bg-background shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b-1 px-3 py-2 select-none">
        <p className="text-sm font-medium">New message</p>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => resetComposer()}
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
              value={recipients}
              onValueChange={setRecipients}
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
            className="min-h-60 resize-none"
          />
        </div>

        <div className="flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => resetComposer()}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (recipients.length === 0) return;
              await sendEmail({
                to: recipients,
                subject,
                body,
              });
              resetComposer();
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
