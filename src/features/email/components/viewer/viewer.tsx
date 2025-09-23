"use client";

import React from "react";
import { useEmailStore } from "@/features/email/state/store";
import ViewerHeader from "@/features/email/components/viewer/viewer-header";
import ShadowDom from "@/features/email/components/viewer/shadow-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function EmptyViewer() {
  return (
    <div className="flex flex-col h-full w-full p-4 items-center justify-center">
      <p className="text-sm text-muted-foreground">No message selected</p>
    </div>
  );
}

export default function Viewer() {
  const selectedMessage = useEmailStore((state) =>
    state.mailboxEntries.find((item) => item._id === state.selectedMessageId),
  );
  const createMailboxEntry = useEmailStore((state) => state.createMailboxEntry);
  const deleteMailboxEntry = useEmailStore((state) => state.deleteMailboxEntry);
  const setSelectedMessageId = useEmailStore(
    (state) => state.setSelectedMessageId,
  );

  const deleteEntry = useMutation(api.email.mailbox.deleteEntry);

  if (!selectedMessage) return <EmptyViewer />;

  return (
    <div className="flex flex-col h-full w-full">
      <ViewerHeader
        subject={selectedMessage.subject}
        fromName={selectedMessage.senderName}
        fromEmail={selectedMessage.senderEmail}
        recipients={selectedMessage.recipients}
        onReply={() => {}}
        onDelete={() => {
          deleteMailboxEntry(selectedMessage._id);
          deleteEntry({ mailboxEntryId: selectedMessage._id }).catch(() => {
            createMailboxEntry(selectedMessage);
            setSelectedMessageId(selectedMessage._id);
          });
        }}
      />

      <div className="flex flex-col h-full w-full p-2">
        <ShadowDom html={selectedMessage.body} />
      </div>
    </div>
  );
}
