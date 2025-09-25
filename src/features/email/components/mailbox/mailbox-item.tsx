"use client";

import { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { useEmailStore } from "@/features/email/state/store";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/shared/lib/ui-utils";

type Props = {
  id: Id<"mailboxEntries">;
  threadId: string;
  sender: string;
  subject: string;
  preview: string;
  dateEpoch: number;
  initialIsRead: boolean;
  isSelected: boolean;
};

export default function MailboxItem({
  id,
  threadId,
  sender,
  subject,
  preview,
  dateEpoch,
  initialIsRead,
  isSelected,
}: Props) {
  const storedIsRead = useEmailStore(
    (state) => state.mailboxEntries.find((entry) => entry._id === id)?.isRead,
  );
  const isRead = storedIsRead ?? initialIsRead;
  const { setSelectedThreadId, updateMailboxEntry } = useEmailStore();
  const markAsRead = useMutation(api.email.mailbox.markEntryRead);

  const dateStr = useMemo(() => {
    return new Date(dateEpoch).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, [dateEpoch]);

  return (
    <div
      onClick={() => {
        setSelectedThreadId(threadId);

        if (!isRead) {
          updateMailboxEntry(id, { isRead: true });
          markAsRead({ mailboxEntryId: id, isRead: true }).catch(() => {
            updateMailboxEntry(id, { isRead: false });
          });
        }
      }}
      className={cn(
        "flex flex-col gap-1 border-b-1 px-2 py-4 select-none hover:bg-muted/40 cursor-pointer transition-colors",
        {
          "bg-muted/30": isSelected,
        },
      )}
    >
      <div className="flex flex-row gap-2 justify-between">
        <p className="text-sm font-semibold">{sender}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>
      <p
        className={cn(`text-sm`, {
          "text-muted-foreground": isRead,
        })}
      >
        {subject}
      </p>
      <p className="text-xs text-muted-foreground truncate whitespace-nowrap">
        {preview}
      </p>
    </div>
  );
}
