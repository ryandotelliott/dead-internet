import { Button } from "@/shared/components/ui/button";
import { Reply, Trash, Trash2 } from "lucide-react";
import React from "react";

type Props = {
  subject: string;
};

export default function ViewerHeader({ subject }: Props) {
  return (
    <div className="flex flex-row justify-between items-center p-2 border-b-1 min-h-14">
      <p className="text-sm font-medium">{subject}</p>

      <div className="flex flex-row gap-2">
        <Button size="sm" variant="outline">
          <Reply className="size-4" />
          Reply
        </Button>
        <Button size="icon-sm" variant="destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
