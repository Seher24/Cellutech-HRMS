"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { punchAttendanceAction, upsertAttendanceAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";

const STATUSES = ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "REMOTE"] as const;

export function AttendanceForm({
  userId,
  currentStatus,
  checkInAt,
  checkOutAt,
}: {
  userId: string;
  currentStatus: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Timesheet punch</h3>
        <p className="mt-1 text-sm text-slate-500">
          Check-in: {checkInAt ?? "Not yet"} · Check-out: {checkOutAt ?? "Not yet"}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            disabled={pending || !!checkInAt}
            className="w-full bg-teal-700 hover:bg-teal-800 sm:w-auto"
            onClick={() => {
              startTransition(async () => {
                await punchAttendanceAction({ type: "IN" });
                router.refresh();
              });
            }}
          >
            Check in
          </Button>
          <Button
            disabled={pending || !checkInAt || !!checkOutAt}
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              startTransition(async () => {
                const result = await punchAttendanceAction({ type: "OUT" });
                if (result?.error) alert(result.error);
                router.refresh();
              });
            }}
          >
            Check out
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Mark today&apos;s status</h3>
        <p className="mt-1 text-sm text-slate-500">
          Current: {currentStatus ?? "Not marked"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {STATUSES.map((status) => (
            <Button
              key={status}
              disabled={pending}
              variant={currentStatus === status ? "default" : "outline"}
              className={
                currentStatus === status
                  ? "w-full bg-teal-700 hover:bg-teal-800 sm:w-auto"
                  : "w-full sm:w-auto"
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
    </div>
  );
}
