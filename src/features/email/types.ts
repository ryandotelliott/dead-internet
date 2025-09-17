import { Doc } from "@/convex/_generated/dataModel";

type User = Doc<"users">;
type EmailMessage = Doc<"emailMessages">;
type ListingItem = Pick<
  EmailMessage,
  "_id" | "from" | "subject" | "_creationTime" | "to"
>;

export type { User, EmailMessage, ListingItem };
