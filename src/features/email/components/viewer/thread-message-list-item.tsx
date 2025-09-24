"use client";

import React from "react";

import ShadowDom from "@/features/email/components/viewer/shadow-dom";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui-utils";

interface ThreadMessageListItemProps {
  message: ThreadMessage;
  isExpanded: boolean;
  onToggle(key: string): void;
}

export function ThreadMessageListItem({
  message,
  isExpanded,
  onToggle,
}: ThreadMessageListItemProps) {
  const recipientSummary = React.useMemo(
    () =>
      message.recipients
        .map((recipient) => recipient.name || recipient.email)
        .filter(Boolean)
        .join(", "),
    [message.recipients],
  );

  const senderDisplay =
    message.authorName || message.authorEmail || "Unknown sender";
  const shouldShowEmailInline = Boolean(
    message.authorEmail &&
      message.authorName &&
      message.authorName !== message.authorEmail,
  );

  return (
    <div className="border-b-1 last:border-b-0">
      <Button
        type="button"
        variant="default"
        className={cn(
          "h-auto w-full flex flex-col items-start justify-start gap-1 px-3 py-2 text-left shadow-none rounded-none hover:bg-muted/40",
          isExpanded ? "bg-muted/30 " : "bg-background",
        )}
        onClick={() => onToggle(message.key)}
      >
        <span className="text-sm font-medium text-foreground">
          {senderDisplay}
        </span>
        {isExpanded ? null : (
          <span className="text-xs text-muted-foreground truncate">
            {message.preview || "<No content>"}
          </span>
        )}
        {!isExpanded ? null : (
          <div className="text-xs text-muted-foreground">
            <div>
              From: {senderDisplay}
              {shouldShowEmailInline ? (
                <span className="text-muted-foreground">{` <${message.authorEmail}>`}</span>
              ) : null}
            </div>
            <div>To: {recipientSummary}</div>
          </div>
        )}
      </Button>

      {!isExpanded ? null : (
        <div className="p-4">
          <ShadowDom html={message.body} />
        </div>
      )}
    </div>
  );
}

export interface ThreadMessage {
  key: string;
  authorName: string;
  authorEmail: string;
  body: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
  timestamp: string | number;
  preview: string;
}
