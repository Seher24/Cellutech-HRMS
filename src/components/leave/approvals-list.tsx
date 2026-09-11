"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideLeaveAction } from "@/lib/actions/leave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ApprovalItem = {
  id: string;
  totalDays: number;
  reason: string;
  status: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  employee: string;
  department: string | null;
  canOverride: boolean;
  isCurrentApprover: boolean;
};

export function ApprovalsList({ items }: { items: ApprovalItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function decide(
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    override?: boolean
  ) {
    setError(null);
    startTransition(async () => {
      const result = await decideLeaveAction({
        requestId,
        decision,
        comment: comments[requestId],
        override,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No pending approvals in your queue.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{item.employee}</h3>
              <p className="text-sm text-slate-500">
                {item.leaveType} · {item.totalDays} working day(s) ·{" "}
                {item.department ?? "-"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {item.startDate} → {item.endDate}
              </p>
            </div>
            <Badge variant="secondary">{item.status}</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-700">{item.reason}</p>
          <Textarea
            className="mt-3"
            placeholder="Comment (optional)"
            value={comments[item.id] ?? ""}
            onChange={(e) =>
              setComments((c) => ({ ...c, [item.id]: e.target.value }))
            }
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {(item.isCurrentApprover || item.canOverride) && (
              <>
                <Button
                  disabled={pending}
                  className="bg-teal-700 hover:bg-teal-800"
                  onClick={() =>
                    decide(item.id, "APPROVED", !item.isCurrentApprover && item.canOverride)
                  }
                >
                  Approve
                </Button>
                <Button
                  disabled={pending}
                  variant="destructive"
                  onClick={() =>
                    decide(item.id, "REJECTED", !item.isCurrentApprover && item.canOverride)
                  }
                >
                  Reject
                </Button>
              </>
            )}
            {item.canOverride && item.isCurrentApprover && (
              <Button
                disabled={pending}
                variant="outline"
                onClick={() => decide(item.id, "APPROVED", true)}
              >
                HR Override Approve
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
