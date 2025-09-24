import { StateCreator } from "zustand";
import type { MailboxEntry } from "@/convex/email/emails";
import { Id } from "@/convex/_generated/dataModel";

// Mailbox state - handles email list, selection, and CRUD operations
export interface MailboxSlice {
  // Selection state
  selectedMessageId: Id<"mailboxEntries"> | null;
  setSelectedMessageId: (messageId: Id<"mailboxEntries"> | null) => void;

  // Mailbox entries management
  mailboxEntries: MailboxEntry[];
  setMailboxEntries: (entries: MailboxEntry[]) => void;
  updateMailboxEntry: (
    id: Id<"mailboxEntries">,
    updates: Partial<MailboxEntry>,
  ) => void;
  addMailboxEntry: (entry: MailboxEntry) => void;
  removeMailboxEntry: (id: Id<"mailboxEntries">) => void;
}

export const createMailboxSlice: StateCreator<
  MailboxSlice,
  [],
  [],
  MailboxSlice
> = (set) => ({
  // Selection
  selectedMessageId: null,
  setSelectedMessageId: (messageId) => set({ selectedMessageId: messageId }),

  // Mailbox entries
  mailboxEntries: [],
  setMailboxEntries: (entries) => set({ mailboxEntries: entries }),

  updateMailboxEntry: (id, updates) =>
    set((state) => ({
      mailboxEntries: state.mailboxEntries.map((entry) =>
        entry._id === id ? { ...entry, ...updates } : entry,
      ),
    })),

  addMailboxEntry: (entry) =>
    set((state) => ({
      mailboxEntries: [...state.mailboxEntries, entry],
    })),

  removeMailboxEntry: (id) =>
    set((state) => ({
      mailboxEntries: state.mailboxEntries.filter((entry) => entry._id !== id),
    })),
});
