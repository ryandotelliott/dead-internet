"use client";

import { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { useEmailStore } from "@/features/email/state/store";

type Props = {
  id: Id<"emailMessages">;
  sender: string;
  subject: string;
  dateEpoch: number;
};

export default function ListingRow({ id, sender, subject, dateEpoch }: Props) {
  const { setSelectedMessageId } = useEmailStore();

  const dateStr = useMemo(() => {
    return new Date(dateEpoch).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, [dateEpoch]);

  return (
    <div
      onClick={() => {
        setSelectedMessageId(id);
      }}
      className="flex flex-col gap-2 border-b-1 px-2 py-4 select-none hover:bg-accent cursor-pointer hover:border-transparent transition-colors"
    >
      <div className="flex flex-row gap-2 justify-between">
        <p className="text-sm">{sender}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>
      <p className="text-sm text-muted-foreground">{subject}</p>
    </div>
  );
}
