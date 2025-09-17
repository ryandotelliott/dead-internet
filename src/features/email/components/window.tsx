"use client";

import React, { useState } from "react";
import InboxItem from "./inbox-item";
import { Button } from "@/shared/components/ui/button";
import Viewer from "./viewer";
import Composer from "./composer";

type Props = {};

export default function EmailWindow({}: Props) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <div className="flex w-full h-full border-1 relative">
      <div className="flex flex-col h-full border-r-1 min-w-80">
        <div className="flex flex-row justify-between items-center p-2 border-b-1">
          <h1 className="font-medium text-sm select-none">Inbox</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsComposeOpen(true)}
          >
            Compose
          </Button>
        </div>
        <InboxItem sender="John Doe" subject="Hello" date="2025-01-01" />
        <InboxItem sender="Jane Doe" subject="Hello" date="2025-01-01" />
        <InboxItem sender="John Doe" subject="Hello" date="2025-01-01" />
        <InboxItem sender="Jane Doe" subject="Hello" date="2025-01-01" />
      </div>
      <Viewer email={undefined} />
      <Composer
        initialRecipients={[]}
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}
