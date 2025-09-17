import React from "react";
import ListingHeader from "@/features/email/components/listing/listing-header";
import ListingRows from "@/features/email/components/listing/listing-rows";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function Listing() {
  const messages = await preloadQuery(api.email.messages.listInbox);

  return (
    <div className="flex flex-col h-full border-r-1 min-w-80 overflow-y-auto">
      <ListingHeader />
      <ListingRows preloadedMessages={messages ?? []} />
    </div>
  );
}
