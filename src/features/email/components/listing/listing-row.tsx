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
  initialIsRead: boolean;
};

export default function ListingRow({
  id,
  sender,
  subject,
  dateEpoch,
  initialIsRead,
}: Props) {
  const storedIsRead = useEmailStore(
    (state) => state.mailboxEntries.find((entry) => entry._id === id)?.isRead,
  );
  const isRead = storedIsRead ?? initialIsRead;
  const { setSelectedMessageId, updateMailboxEntry } = useEmailStore();
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
        setSelectedMessageId(id);
        // Optimistically mark as read

        if (!isRead) {
          updateMailboxEntry(id, { isRead: true });
          markAsRead({ mailboxEntryId: id, isRead: true }).catch(() => {
            updateMailboxEntry(id, { isRead: false });
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
          "text-muted-foreground": isRead,
        })}
      >
        {subject}
      </p>
    </div>
  );
}
