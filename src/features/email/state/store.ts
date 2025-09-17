import { create, StateCreator } from "zustand";
import { EmailMessage, ListingItem } from "@/features/email/types";
import { ComposerSlice, createComposerSlice } from "./composer-slice";

interface EmailViewerSlice {
  selectedMessage: EmailMessage | null;
  setSelectedMessage: (message: EmailMessage | null) => void;
  inboxItems: ListingItem[];
  setInboxItems: (items: ListingItem[]) => void;
}

const createEmailViewerSlice: StateCreator<
  EmailViewerSlice & ComposerSlice,
  [],
  [],
  EmailViewerSlice
> = (set) => ({
  selectedMessage: null,
  setSelectedMessage: (message: EmailMessage | null) => {
    set({ selectedMessage: message });
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
