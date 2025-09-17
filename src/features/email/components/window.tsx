import React from "react";
import Viewer from "@/features/email/components/viewer/viewer";
import Composer from "@/features/email/components/composer";
import Listing from "@/features/email/components/listing/listing";

export default function EmailWindow() {
  return (
    <div className="flex w-full h-full border-1 relative">
      <Listing />
      <Viewer />
      <Composer initialRecipients={[]} />
    </div>
  );
}
