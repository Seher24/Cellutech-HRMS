"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelLeaveAction } from "@/lib/actions/leave";
import { Button } from "@/components/ui/button";

export function CancelLeaveButton({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!["PENDING", "PENDING_L2", "APPROVED"].includes(status)) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this leave request?")) return;
        startTransition(async () => {
          const result = await cancelLeaveAction(requestId);
          if (result?.error) {
            alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Cancelling..." : "Cancel request"}
    </Button>
  );
}
