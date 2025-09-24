import { Button } from "@/shared/components/ui/button";
import { Reply, Trash2 } from "lucide-react";
import React from "react";

type Props = {
  subject: string;
  onReply: () => void;
  onDelete: () => void;
};

export default function ViewerHeader({ subject, onReply, onDelete }: Props) {
  return (
    <div className="flex flex-row justify-between items-center p-2 min-h-14 border-b-1">
      <p className="text-sm font-medium leading-none">{subject}</p>

      <div className="flex flex-row gap-2">
        <Button size="sm" variant="outline" onClick={onReply}>
          <Reply className="size-4" />
          Reply
        </Button>
        <Button size="icon-sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
