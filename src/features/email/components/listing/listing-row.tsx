"use client";

import { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { useEmailStore } from "@/features/email/state/store";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/shared/lib/ui-utils";

type Props = {
  id: Id<"mailboxEntries">;
  sender: string;
  subject: string;
  dateEpoch: number;
};

export default function ListingRow({ id, sender, subject, dateEpoch }: Props) {
  const { setSelectedMessageId, updateMailboxEntry, mailboxEntries } =
    useEmailStore();
  const markRead = useMutation(api.email.emails.markMailboxEntryRead);

  const dateStr = useMemo(() => {
    return new Date(dateEpoch).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, [dateEpoch]);

  return (
    <div
      onClick={() => {
        setSelectedMessageId(id);
        // Optimistically mark as read
        const current = mailboxEntries.find((m) => m._id === id);
        if (current && !current.read) {
          updateMailboxEntry(id, { read: true });
          markRead({ mailboxEntryId: id, read: true }).catch(() => {
            updateMailboxEntry(id, { read: false });
          });
        }
      }}
      className="flex flex-col gap-1 border-b-1 px-2 py-4 select-none hover:bg-accent cursor-pointer hover:border-transparent transition-colors"
    >
      <div className="flex flex-row gap-2 justify-between">
        <p className="text-sm font-semibold">{sender}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>
      <p
        className={cn(`text-sm`, {
          "text-muted-foreground": mailboxEntries.find((m) => m._id === id)
            ?.read,
        })}
      >
        {subject}
      </p>
    </div>
  );
}
