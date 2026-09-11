"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLeaveRequestAction } from "@/lib/actions/leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  leaveTypeId: z.string().min(1, "Select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000),
});

type FormValues = z.infer<typeof schema>;
type LeaveTypeOption = { id: string; name: string; remaining: number };

export function LeaveRequestForm({ leaveTypes }: { leaveTypes: LeaveTypeOption[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: leaveTypes[0]?.id ?? "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createLeaveRequestAction(values);
      if (result?.error) {
        setServerError(result.error);
        return;
      }
      router.push("/leave/my-requests");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="leaveTypeId">Leave type</Label>
        <select
          id="leaveTypeId"
          className="relative z-10 flex h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          {...register("leaveTypeId")}
        >
          <option value="" disabled>
            Select leave type
          </option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name} ({lt.remaining} remaining)
            </option>
          ))}
        </select>
        {errors.leaveTypeId && (
          <p className="text-xs text-red-600">{errors.leaveTypeId.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-red-600">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-xs text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" rows={4} {...register("reason")} />
        {errors.reason && (
          <p className="text-xs text-red-600">{errors.reason.message}</p>
        )}
      </div>
      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
    </form>
  );
}
