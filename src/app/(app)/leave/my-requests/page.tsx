import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function MyLeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const requests = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id },
    include: {
      leaveType: true,
      approvalSteps: {
        include: { approver: true },
        orderBy: { level: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">My leave</h2>
          <p className="text-sm text-slate-500">Track request status and approval trail</p>
        </div>
        <Link href="/leave/request">
          <Button className="bg-teal-700 hover:bg-teal-800">New request</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No leave requests yet.
          </div>
        )}
        {requests.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{r.leaveType.name}</p>
                <p className="text-sm text-slate-500">
                  {r.startDate.toLocaleDateString()} - {r.endDate.toLocaleDateString()} ·{" "}
                  {r.totalDays} day(s)
                </p>
              </div>
              <Badge variant="secondary">{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-700">{r.reason}</p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Approval trail
              </p>
              {r.approvalSteps.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>
                    L{s.level}: {s.approver.firstName} {s.approver.lastName}
                  </span>
                  <span className="text-slate-500">
                    {s.decision}
                    {s.comment ? ` - ${s.comment}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
