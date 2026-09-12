import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

export default async function LeaveRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const year = new Date().getFullYear();
  const balances = await prisma.leaveBalance.findMany({
    where: { userId: session.user.id, year },
    include: { leaveType: true },
    orderBy: { leaveType: { name: "asc" } },
  });

  const leaveTypes = balances.map((b) => ({
    id: b.leaveTypeId,
    name: b.leaveType.name,
    remaining: b.allotted - b.used,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Request leave</h2>
        <p className="text-sm text-slate-500">
          Working days exclude weekends and subsidiary holidays.
        </p>
      </div>
      <LeaveRequestForm leaveTypes={leaveTypes} />
    </div>
  );
}
