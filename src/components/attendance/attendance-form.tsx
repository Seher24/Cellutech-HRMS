"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertAttendanceAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";

const STATUSES = ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "REMOTE"] as const;

export function AttendanceForm({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Mark today&apos;s status</h3>
      <p className="mt-1 text-sm text-slate-500">
        Current: {currentStatus ?? "Not marked"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <Button
            key={status}
            disabled={pending}
            variant={currentStatus === status ? "default" : "outline"}
            className={
              currentStatus === status ? "bg-teal-700 hover:bg-teal-800" : ""
            }
            onClick={() => {
              startTransition(async () => {
                await upsertAttendanceAction({
                  userId,
                  date: today,
                  status,
                });
                router.refresh();
              });
            }}
          >
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
}
