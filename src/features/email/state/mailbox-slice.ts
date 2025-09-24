import { StateCreator } from "zustand";
import type { MailboxEntry } from "@/convex/email/emails";
import { Id } from "@/convex/_generated/dataModel";

// Mailbox state - handles email list, selection, and CRUD operations
export interface MailboxSlice {
  // Selection state
  selectedThreadId: string | null;
  setSelectedThreadId: (threadId: string | null) => void;

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
  selectedThreadId: null,
  setSelectedThreadId: (threadId) => set({ selectedThreadId: threadId }),

  // Mailbox entries
  mailboxEntries: [],
  setMailboxEntries: (entries) =>
    set((state) => ({
      mailboxEntries: entries,
      selectedThreadId:
        state.selectedThreadId &&
        entries.some((entry) => entry.threadId === state.selectedThreadId)
          ? state.selectedThreadId
          : null,
    })),

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
    set((state) => {
      const entryToRemove = state.mailboxEntries.find((entry) => entry._id === id);
      const nextEntries = state.mailboxEntries.filter((entry) => entry._id !== id);

      const shouldClearSelection =
        entryToRemove?.threadId &&
        entryToRemove.threadId === state.selectedThreadId;

      return {
        mailboxEntries: nextEntries,
        selectedThreadId: shouldClearSelection ? null : state.selectedThreadId,
      };
    }),
});
