import React from "react";
import MailboxHeader from "@/features/email/components/mailbox/mailbox-header";
import MailboxItems from "@/features/email/components/mailbox/mailbox-items";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getToken } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@/convex/auth";

export default async function Mailbox() {
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
      <MailboxHeader />
      <MailboxItems preloadedMessages={messages ?? []} />
    </div>
  );
}
