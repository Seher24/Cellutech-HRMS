"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateEmployeeAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";

export function DeactivateEmployeeButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Deactivate this employee and revoke access?")) return;
        startTransition(async () => {
          await deactivateEmployeeAction(userId);
          router.refresh();
        });
      }}
    >
      {pending ? "Deactivating…" : "Deactivate employee"}
    </Button>
  );
}
