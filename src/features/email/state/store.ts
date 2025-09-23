import { create, StateCreator } from "zustand";
import type { MailboxEntry } from "@/convex/email/emails";
import { ComposerSlice, createComposerSlice } from "./composer-slice";
import { Id } from "@/convex/_generated/dataModel";

interface EmailViewerSlice {
  selectedMessageId: Id<"mailboxEntries"> | null;
  setSelectedMessageId: (messageId: Id<"mailboxEntries"> | null) => void;
  mailboxEntries: MailboxEntry[];
  setMailboxEntries: (items: MailboxEntry[]) => void;
  updateMailboxEntry: (
    id: Id<"mailboxEntries">,
    patch: Partial<MailboxEntry>,
  ) => void;
  createMailboxEntry: (entry: MailboxEntry) => void;
  deleteMailboxEntry: (id: Id<"mailboxEntries">) => void;
}

const createEmailViewerSlice: StateCreator<
  EmailViewerSlice & ComposerSlice,
  [],
  [],
  EmailViewerSlice
> = (set) => ({
  selectedMessageId: null,
  setSelectedMessageId: (messageId: Id<"mailboxEntries"> | null) => {
    set({ selectedMessageId: messageId });
  },
  mailboxEntries: [],
  setMailboxEntries: (items: MailboxEntry[]) => {
    set({ mailboxEntries: items });
  },
  updateMailboxEntry: (id, patch) => {
    set((state) => ({
      mailboxEntries: state.mailboxEntries.map((m) =>
        m._id === id ? { ...m, ...patch } : m,
      ),
    }));
  },
  createMailboxEntry: (entry: MailboxEntry) => {
    set((state) => ({
      mailboxEntries: [...state.mailboxEntries, entry],
    }));
  },
  deleteMailboxEntry: (id) => {
    set((state) => ({
      mailboxEntries: state.mailboxEntries.filter((m) => m._id !== id),
    }));
  },
});

export const useEmailStore = create<EmailViewerSlice & ComposerSlice>()(
  (...a) => ({
    ...createEmailViewerSlice(...a),
    ...createComposerSlice(...a),
  }),
);
