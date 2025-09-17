"use client";

import React from "react";
import { useEmailStore } from "@/features/email/state/store";

function EmptyViewer() {
  return (
    <div className="flex flex-col h-full w-full p-4 items-center justify-center">
      <p className="text-sm text-muted-foreground">No message selected</p>
    </div>
  );
}

export default function Viewer() {
  const selectedMessageId = useEmailStore((state) => state.selectedMessageId);
  const selectedMessage = useEmailStore((state) =>
    state.inboxItems.find((item) => item._id === selectedMessageId),
  );

  if (!selectedMessage) return <EmptyViewer />;

  return (
    <div className="flex flex-col h-full w-full p-4">
      <p className="text-sm text-muted-foreground">{selectedMessage.subject}</p>
      <p className="text-sm text-muted-foreground">{selectedMessage.body}</p>
    </div>
  );
}
