import { StateCreator } from "zustand";

export interface ComposerSlice {
  recipients: string[];
  subject: string;
  body: string;
  isComposerOpen: boolean;
  setRecipients: (recipients: string[]) => void;
  addRecipient: (recipient: string) => void;
  removeRecipient: (recipient: string) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  setIsComposerOpen: (isOpen: boolean) => void;
  resetComposer: () => void;
}

const initialState = {
  recipients: [],
  subject: "",
  body: "",
  isComposerOpen: false,
};

export const createComposerSlice: StateCreator<
  ComposerSlice,
  [],
  [],
  ComposerSlice
> = (set) => ({
  ...initialState,
  setRecipients: (recipients) => set({ recipients }),
  addRecipient: (recipient) =>
    set((state) => ({ recipients: [...state.recipients, recipient] })),
  removeRecipient: (recipient) =>
    set((state) => ({
      recipients: state.recipients.filter((r) => r !== recipient),
    })),
  setSubject: (subject) => set({ subject }),
  setBody: (body) => set({ body }),
  setIsComposerOpen: (isOpen) => set({ isComposerOpen: isOpen }),
  resetComposer: () => set({ ...initialState }),
});
