"use client";

import React, { useEffect } from "react";
import ListingRow from "@/features/email/components/listing/listing-row";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEmailStore } from "@/features/email/state/store";
import { useShallow } from "zustand/react/shallow";

type Props = {
  preloadedMessages: Preloaded<typeof api.email.mailbox.listEntries>;
};

export default function ListingRows({ preloadedMessages }: Props) {
  const messages = usePreloadedQuery(preloadedMessages);
  const { setMailboxEntries, selectedMessageId } = useEmailStore(
    useShallow((state) => ({
      setMailboxEntries: state.setMailboxEntries,
      selectedMessageId: state.selectedMessageId,
    })),
  );

  useEffect(() => {
    const items = messages ?? [];
    setMailboxEntries(items);
  }, [messages, setMailboxEntries]);

  return (
    <div>
      {messages?.map((message) => (
        <ListingRow
          key={message._id}
          id={message._id}
          sender={message.senderName}
          subject={message.subject}
          dateEpoch={message._creationTime}
          initialIsRead={message.isRead}
          isSelected={message._id === selectedMessageId}
        />
      ))}
    </div>
  );
}
