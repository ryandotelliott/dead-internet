import React from "react";
import InboxItem from "./listing-item";
import { Button } from "@/shared/components/ui/button";
import { useEmailStore } from "@/features/email/state/store";

export default function Listing() {
  const { setIsComposerOpen } = useEmailStore();

  return (
    <div className="flex flex-col h-full border-r-1 min-w-80">
      <div className="flex flex-row justify-between items-center p-2 border-b-1">
        <h1 className="font-medium text-sm select-none">Inbox</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsComposerOpen(true)}
        >
          Compose
        </Button>
      </div>
      <InboxItem sender="John Doe" subject="Hello" date="2025-01-01" />
      <InboxItem sender="Jane Doe" subject="Hello" date="2025-01-01" />
      <InboxItem sender="John Doe" subject="Hello" date="2025-01-01" />
      <InboxItem sender="Jane Doe" subject="Hello" date="2025-01-01" />
    </div>
  );
}
