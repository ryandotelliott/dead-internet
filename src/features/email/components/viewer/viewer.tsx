"use client";

import React from "react";
import { useEmailStore } from "@/features/email/state/store";
import ViewerHeader from "@/features/email/components/viewer/viewer-header";
import ShadowDom from "@/features/email/components/viewer/shadow-dom";

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
    state.mailboxEntries.find((item) => item._id === selectedMessageId),
  );

  if (!selectedMessage) return <EmptyViewer />;

  return (
    <div className="flex flex-col h-full w-full">
      <ViewerHeader
        subject={selectedMessage.subject}
        fromName={selectedMessage.senderName}
        fromEmail={selectedMessage.senderEmail}
        recipients={selectedMessage.recipients}
      />

      <div className="flex flex-col h-full w-full p-2">
        <ShadowDom html={selectedMessage.body} />
      </div>
    </div>
  );
}
