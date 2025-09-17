"use client";

import EmailWindow from "@/features/email/components/window";
import { Input } from "@/shared/components/ui/input";

export default function Home() {
  return (
    <div className="w-full h-full p-4">
      <EmailWindow />
    </div>
  );
}
