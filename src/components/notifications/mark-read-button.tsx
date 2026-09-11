"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";

export function MarkReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markNotificationsReadAction();
          router.refresh();
        });
      }}
    >
      {pending ? "Updating…" : "Mark all read"}
    </Button>
  );
}
