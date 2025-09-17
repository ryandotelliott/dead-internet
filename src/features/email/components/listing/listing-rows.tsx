"use client";

import React, { useEffect } from "react";
import ListingRow from "./listing-row";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEmailStore } from "../../state/store";

type Props = {
  preloadedMessages: Preloaded<typeof api.email.messages.listInbox>;
};

export default function ListingRows({ preloadedMessages }: Props) {
  const messages = usePreloadedQuery(preloadedMessages);
  const { setInboxItems } = useEmailStore();

  useEffect(() => {
    setInboxItems(messages ?? []);
  }, [messages]);

  return (
    <div>
      {messages?.map((message) => (
        <ListingRow
          key={message._id}
          id={message._id}
          sender={message.senderName}
          subject={message.subject}
          dateEpoch={message._creationTime}
        />
      ))}
    </div>
  );
}
