"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequestAction } from "@/lib/actions/leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeaveTypeOption = { id: string; name: string; remaining: number };

export function LeaveRequestForm({ leaveTypes }: { leaveTypes: LeaveTypeOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createLeaveRequestAction({
        leaveTypeId: String(fd.get("leaveTypeId")),
        startDate: String(fd.get("startDate")),
        endDate: String(fd.get("endDate")),
        reason: String(fd.get("reason")),
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.push("/leave/my-requests");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="leaveTypeId">Leave type</Label>
        <select
          id="leaveTypeId"
          name="leaveTypeId"
          required
          className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name} ({lt.remaining} remaining)
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required minLength={5} rows={4} />
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Leave submitted successfully.
        </p>
      )}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
