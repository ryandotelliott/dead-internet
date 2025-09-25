"use client";

import { Button } from "@/shared/components/ui/button";
import React from "react";
import { useEmailStore } from "@/features/email/state/store";

export default function MailboxHeader() {
  const { setIsComposerOpen } = useEmailStore();

  return (
    <div>
      <div className="flex flex-row justify-between items-center p-2 border-b-1 min-h-14">
        <h1 className="font-medium text-sm select-none">Inbox</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsComposerOpen(true)}
        >
          Compose
        </Button>
      </div>
    </div>
  );
}
