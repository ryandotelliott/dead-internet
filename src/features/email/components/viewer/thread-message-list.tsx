"use client";

import React, { useLayoutEffect } from "react";

import {
  ThreadMessageListItem,
  type ThreadMessage,
} from "./thread-message-list-item";

interface ThreadMessageListProps {
  messages: ThreadMessage[];
}

export function ThreadMessageList({ messages }: ThreadMessageListProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);
  const hasMessages = messages.length > 0;
  const lastMessageKey = hasMessages ? messages[messages.length - 1]?.key : "";

  const lastMessageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasMessages) {
      setExpandedKeys([]);
      return;
    }

    if (lastMessageKey) {
      setExpandedKeys((prev) =>
        prev.length === 1 && prev[0] === lastMessageKey
          ? prev
          : [lastMessageKey],
      );
    }
  }, [hasMessages, lastMessageKey]);

  useLayoutEffect(() => {
    if (!hasMessages) return;

    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [hasMessages, lastMessageKey]);

  const handleToggle = React.useCallback((key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }, []);

  if (!messages.length) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <ThreadMessageListItem
          key={message.key}
          message={message}
          isExpanded={expandedKeys.includes(message.key)}
          onToggle={handleToggle}
          ref={lastMessageKey === message.key ? lastMessageRef : undefined}
        />
      ))}
    </div>
  );
}

export type { ThreadMessage };
