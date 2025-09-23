import { Button } from "@/shared/components/ui/button";
import { Reply, Trash2 } from "lucide-react";
import React from "react";

type Props = {
  subject: string;
  fromName: string;
  fromEmail: string;
  recipients: Array<{ name: string; email: string }>; // To
  onReply: () => void;
  onDelete: () => void;
};

export default function ViewerHeader({
  subject,
  fromName,
  fromEmail,
  recipients,
  onReply,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-col border-b-1">
      <div className="flex flex-row justify-between items-center p-2 min-h-14 border-b-1">
        <p className="text-sm font-medium">{subject}</p>

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

      <div className="flex flex-col gap-2 text-xs text-muted-foreground px-2 pb-2 pt-2">
        <span>
          From: <span className="text-foreground">{fromName}</span>{" "}
          {fromEmail ? (
            <span className="text-muted-foreground">&lt;{fromEmail}&gt;</span>
          ) : null}
        </span>
        <span>
          To:{" "}
          <span className="text-foreground">
            {recipients.map((r) => r.name || r.email).join(", ")}
          </span>
        </span>
      </div>
    </div>
  );
}
