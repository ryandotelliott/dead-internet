import React from "react";
import ListingHeader from "@/features/email/components/listing/listing-header";
import ListingRows from "@/features/email/components/listing/listing-rows";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getToken } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@/convex/auth";

export default async function Listing() {
  const token = await getToken(createAuth);
  if (!token) {
    // Return early if unauthenticated so we don't try the preload query
    return null;
  }

  const messages = await preloadQuery(
    api.email.mailbox.listEntries,
    {
      folder: "inbox",
    },
    { token },
  );

  return (
    <div className="flex flex-col h-full border-r-1 min-w-40 w-full overflow-y-auto max-w-80">
      <ListingHeader />
      <ListingRows preloadedMessages={messages ?? []} />
    </div>
  );
}
