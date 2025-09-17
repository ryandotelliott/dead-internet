import { Doc } from "@/convex/_generated/dataModel";

type User = Doc<"user">;
type EmailMessage = Doc<"emailMessage">;
type ListingItem = Pick<
  EmailMessage,
  "_id" | "from" | "subject" | "_creationTime"
>;

export type { User, EmailMessage, ListingItem };
