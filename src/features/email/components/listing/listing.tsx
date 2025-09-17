import React from "react";
import ListingHeader from "./listing-header";

export default function Listing() {
  return (
    <div className="flex flex-col h-full border-r-1 min-w-80">
      <ListingHeader />
    </div>
  );
}
