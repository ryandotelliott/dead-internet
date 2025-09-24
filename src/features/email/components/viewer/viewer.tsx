"use client";

import React from "react";
import { useEmailStore } from "@/features/email/state/store";
import ViewerHeader from "@/features/email/components/viewer/viewer-header";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ThreadMessageList,
  type ThreadMessage,
} from "@/features/email/components/viewer/thread-message-list";

function extractPreview(html: string, maxLength = 120): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const normalized = doc.body.textContent?.replace(/\s+/g, " ").trim();

  if (!normalized) return "<No content>";
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, Math.max(0, maxLength - 1)) + "…";
}

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
  const addMailboxEntry = useEmailStore((state) => state.addMailboxEntry);
  const removeMailboxEntry = useEmailStore((state) => state.removeMailboxEntry);
  const setSelectedMessageId = useEmailStore(
    (state) => state.setSelectedMessageId,
  );
  const initializeReply = useEmailStore((state) => state.initializeReply);

  const profile = useQuery(api.profile.profiles.getCurrent);
  const deleteEntry = useMutation(api.email.mailbox.deleteEntry);
  const threadMessages = useQuery(
    api.email.threads.getThreadContext,
    selectedMessage?.threadId
      ? { emailThreadId: selectedMessage.threadId, limit: 10 }
      : "skip",
  );

  const messages = React.useMemo<ThreadMessage[]>(() => {
    if (!threadMessages) return [];

    return threadMessages.messages.map((message, index) => ({
      key: `${threadMessages.threadId}-${message.timestamp}-${index}`,
      authorName: message.authorName,
      authorEmail: message.authorEmail,
      body: message.body,
      recipients: message.recipients.map((recipient) => ({
        name: recipient.name,
        email: recipient.email,
      })),
      timestamp: message.timestamp,
      preview: extractPreview(message.body),
    }));
  }, [threadMessages]);

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

    recipientEmails.delete(profile.email);

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
        onReply={handleReply}
        onDelete={() => {
          removeMailboxEntry(selectedMessage._id);
          deleteEntry({ mailboxEntryId: selectedMessage._id }).catch(() => {
            addMailboxEntry(selectedMessage);
            setSelectedMessageId(selectedMessage._id);
          });
        }}
      />

      <ThreadMessageList
        messages={messages}
        threadId={selectedMessage.threadId ?? null}
      />
    </div>
  );
}
