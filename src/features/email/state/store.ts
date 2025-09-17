import { create, StateCreator } from "zustand";
import type {
  EmailMessage as EmailMessage,
  InboxItem as ListingItem,
} from "@/convex/email/messages";
import { ComposerSlice, createComposerSlice } from "./composer-slice";
import { Id } from "@/convex/_generated/dataModel";

interface EmailViewerSlice {
  selectedMessageId: Id<"emailMessages"> | null;
  setSelectedMessageId: (messageId: Id<"emailMessages"> | null) => void;
  inboxItems: ListingItem[];
  setInboxItems: (items: ListingItem[]) => void;
}

const createEmailViewerSlice: StateCreator<
  EmailViewerSlice & ComposerSlice,
  [],
  [],
  EmailViewerSlice
> = (set) => ({
  selectedMessageId: null,
  setSelectedMessageId: (messageId: Id<"emailMessages"> | null) => {
    set({ selectedMessageId: messageId });
  },
  inboxItems: [],
  setInboxItems: (items: ListingItem[]) => {
    set({ inboxItems: items });
  },
});

export const useEmailStore = create<EmailViewerSlice & ComposerSlice>()(
  (...a) => ({
    ...createEmailViewerSlice(...a),
    ...createComposerSlice(...a),
  }),
);
