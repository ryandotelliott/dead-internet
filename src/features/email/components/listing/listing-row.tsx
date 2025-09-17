"use client";

import React from "react";

type Props = {
  sender: string;
  subject: string;
  date: string;
};

export default function ListingRow({ sender, subject, date }: Props) {
  return (
    <div className="flex flex-col gap-2 border-b-1 px-2 py-4 select-none hover:bg-accent cursor-pointer hover:border-transparent transition-colors">
      <div className="flex flex-row gap-2 justify-between">
        <p className="text-sm">{sender}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{subject}</p>
    </div>
  );
}
