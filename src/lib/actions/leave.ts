"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { decideLeaveRequest, submitLeaveRequest, cancelLeaveRequest } from "@/lib/leave/workflow";

const leaveSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(5).max(1000),
});

export async function createLeaveRequestAction(input: z.infer<typeof leaveSchema>) {
  const actor = await requireSession();
  const data = leaveSchema.parse(input);
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (endDate < startDate) {
    return { error: "End date must be on or after start date" };
  }

  try {
    await submitLeaveRequest({
      actor,
      leaveTypeId: data.leaveTypeId,
      startDate,
      endDate,
      reason: data.reason,
    });
    revalidatePath("/leave");
    revalidatePath("/dashboard");
    revalidatePath("/leave/my-requests");
    revalidatePath("/leave/approvals");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to submit leave" };
  }
}

export async function decideLeaveAction(input: {
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
  override?: boolean;
}) {
  const actor = await requireSession();
  try {
    await decideLeaveRequest({
      actor,
      requestId: input.requestId,
      decision: input.decision,
      comment: input.comment,
      override: input.override,
    });
    revalidatePath("/leave");
    revalidatePath("/dashboard");
    revalidatePath("/leave/my-requests");
    revalidatePath("/leave/approvals");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Decision failed" };
  }
}

export async function cancelLeaveAction(requestId: string) {
  const actor = await requireSession();
  try {
    await cancelLeaveRequest({ actor, requestId });
    revalidatePath("/leave");
    revalidatePath("/dashboard");
    revalidatePath("/leave/my-requests");
    revalidatePath("/leave/approvals");
    revalidatePath("/leave/calendar");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Cancel failed" };
  }
}
