import React from "react";
import InboxItem from "./inbox-item";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

type Props = {};

export default function EmailWindow({}: Props) {
  return (
    <div className="flex w-full h-full border-1">
      <div className="flex flex-col h-full border-r-1 min-w-80">
        <div className="flex flex-row justify-between items-center p-2 border-b-1">
          <h1 className="font-medium text-sm select-none">Inbox</h1>
          <Button size="sm" variant="outline">
            Compose
          </Button>
        </div>
        <InboxItem sender="John Doe" subject="Hello" date="2021-01-01" />
        <InboxItem sender="Jane Doe" subject="Hello" date="2021-01-01" />
        <InboxItem sender="John Doe" subject="Hello" date="2021-01-01" />
        <InboxItem sender="Jane Doe" subject="Hello" date="2021-01-01" />
      </div>
    </div>
  );
}
