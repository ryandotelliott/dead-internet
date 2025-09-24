import { create } from "zustand";
import { MailboxSlice, createMailboxSlice } from "./mailbox-slice";
import { ComposerSlice, createComposerSlice } from "./composer-slice";

// Combined store with mailbox and composer state
type EmailStore = MailboxSlice & ComposerSlice;

export const useEmailStore = create<EmailStore>()((...args) => ({
  ...createMailboxSlice(...args),
  ...createComposerSlice(...args),
}));
