import type { EmailMessage } from "@/shared/types/email";
import React from "react";

type Props = {
  email?: EmailMessage;
};

export default function Viewer({ email }: Props) {
  return <div className="flex flex-col h-full w-full p-4"></div>;
}
