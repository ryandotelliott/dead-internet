"use client";

import React from "react";
import { useEmailStore } from "@/features/email/state/store";
import ViewerHeader from "@/features/email/components/viewer/viewer-header";
import ShadowDom from "@/features/email/components/viewer/shadow-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function EmptyViewer() {
  return (
    <div className="flex flex-col h-full w-full p-4 items-center justify-center">
      <p className="text-sm text-muted-foreground">No message selected</p>
    </div>
  );
}

export default function Viewer() {
  const profile = useQuery(api.profile.profiles.getCurrent);

  const selectedMessage = useEmailStore((state) =>
    state.mailboxEntries.find((item) => item._id === state.selectedMessageId),
  );
  const addMailboxEntry = useEmailStore((state) => state.addMailboxEntry);
  const removeMailboxEntry = useEmailStore((state) => state.removeMailboxEntry);
  const setSelectedMessageId = useEmailStore(
    (state) => state.setSelectedMessageId,
  );
  const initializeReply = useEmailStore((state) => state.initializeReply);

  const deleteEntry = useMutation(api.email.mailbox.deleteEntry);

  if (!selectedMessage || !profile) return <EmptyViewer />;

  const handleReply = () => {
    if (!selectedMessage.threadId) return;
    const recipientEmails = new Set<string>();
    for (const recipient of selectedMessage.recipients) {
      recipientEmails.add(recipient.email);
    }
    if (selectedMessage.senderEmail) {
      recipientEmails.add(selectedMessage.senderEmail);
    }

    if (profile?.email) {
      recipientEmails.delete(profile.email);
    }

    initializeReply({
      threadId: selectedMessage.threadId,
      recipients: Array.from(recipientEmails),
      subject: selectedMessage.subject,
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <ViewerHeader
        subject={selectedMessage.subject}
        fromName={selectedMessage.senderName}
        fromEmail={selectedMessage.senderEmail}
        recipients={selectedMessage.recipients}
        onReply={handleReply}
        onDelete={() => {
          removeMailboxEntry(selectedMessage._id);
          deleteEntry({ mailboxEntryId: selectedMessage._id }).catch(() => {
            addMailboxEntry(selectedMessage);
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
