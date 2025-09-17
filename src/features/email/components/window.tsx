import React from "react";
import Viewer from "./viewer";
import Composer from "./composer";
import Listing from "./listing/listing";

type Props = {};

export default function EmailWindow({}: Props) {
  return (
    <div className="flex w-full h-full border-1 relative">
      <Listing />
      <Viewer />
      <Composer initialRecipients={[]} />
    </div>
  );
}
