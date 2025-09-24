import { StateCreator } from "zustand";

// Email composition state and actions
export interface ComposerSlice {
  // Composition content
  recipients: string[];
  subject: string;
  body: string;

  // UI state
  isComposerOpen: boolean;

  // Reply context
  replyThreadId: string | null;
  mode: "compose" | "reply";

  // Actions
  setRecipients: (recipients: string[]) => void;
  addRecipient: (recipient: string) => void;
  removeRecipient: (recipient: string) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  setIsComposerOpen: (isOpen: boolean) => void;
  initializeReply: (params: {
    threadId: string;
    recipients: string[];
    subject: string;
  }) => void;
  reset: () => void;
}

const initialComposerState = {
  recipients: [],
  subject: "",
  body: "",
  isComposerOpen: false,
  replyThreadId: null,
  mode: "compose" as const,
};

export const createComposerSlice: StateCreator<
  ComposerSlice,
  [],
  [],
  ComposerSlice
> = (set) => ({
  ...initialComposerState,

  // Recipient management
  setRecipients: (recipients) => set({ recipients }),
  addRecipient: (recipient) =>
    set((state) => ({
      recipients: [...state.recipients, recipient],
    })),
  removeRecipient: (recipient) =>
    set((state) => ({
      recipients: state.recipients.filter((r) => r !== recipient),
    })),

  // Content setters
  setSubject: (subject) => set({ subject }),
  setBody: (body) => set({ body }),

  // UI controls
  setIsComposerOpen: (isOpen) =>
    set((state) =>
      isOpen
        ? { ...initialComposerState, isComposerOpen: true }
        : { ...state, isComposerOpen: false },
    ),

  // Reply initialization
  initializeReply: ({ threadId, recipients, subject }) =>
    set({
      isComposerOpen: true,
      replyThreadId: threadId,
      recipients: Array.from(new Set(recipients)),
      subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      body: "",
      mode: "reply",
    }),
  reset: () => set({ ...initialComposerState }),
});
