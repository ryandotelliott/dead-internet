"use client";

import React, { useEffect } from "react";
import MailboxItem from "@/features/email/components/mailbox/mailbox-item";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEmailStore } from "@/features/email/state/store";
import { useShallow } from "zustand/react/shallow";
import extractPreview from "../../lib/extract-preview";

type Props = {
  preloadedMessages: Preloaded<typeof api.email.mailbox.listEntries>;
};

export default function MailboxItems({ preloadedMessages }: Props) {
  const messages = usePreloadedQuery(preloadedMessages);
  const { setMailboxEntries, selectedThreadId } = useEmailStore(
    useShallow((state) => ({
      setMailboxEntries: state.setMailboxEntries,
      selectedThreadId: state.selectedThreadId,
    })),
  );

  useEffect(() => {
    if (messages === undefined) return;
    setMailboxEntries(messages);
  }, [messages, setMailboxEntries]);

  return (
    <div>
      {messages?.map((message) => (
        <MailboxItem
          key={message._id}
          id={message._id}
          threadId={message.threadId}
          sender={message.senderName}
          subject={message.subject}
          preview={extractPreview(message.body)}
          dateEpoch={message._creationTime}
          initialIsRead={message.isRead}
          isSelected={message.threadId === selectedThreadId}
        />
      ))}
    </div>
  );
}
