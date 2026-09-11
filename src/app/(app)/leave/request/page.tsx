import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

async function ensureLeaveBalances(userId: string, year: number) {
  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
  for (const lt of leaveTypes) {
    await prisma.leaveBalance.upsert({
      where: {
        userId_leaveTypeId_year: {
          userId,
          leaveTypeId: lt.id,
          year,
        },
      },
      create: {
        userId,
        leaveTypeId: lt.id,
        year,
        allotted: lt.defaultAnnualQuota,
        used: 0,
      },
      update: {},
    });
  }
}

export default async function LeaveRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const year = new Date().getFullYear();
  await ensureLeaveBalances(session.user.id, year);

  const balances = await prisma.leaveBalance.findMany({
    where: { userId: session.user.id, year },
    include: { leaveType: true },
    orderBy: { leaveType: { name: "asc" } },
  });

  const leaveTypes = balances.map((b) => ({
    id: b.leaveTypeId,
    name: b.leaveType.name,
    remaining: Math.max(0, b.allotted - b.used),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Request leave</h2>
        <p className="text-sm text-slate-500">
          Working days exclude weekends and subsidiary holidays.
        </p>
      </div>
      {leaveTypes.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No leave types are configured yet. Ask HR to set up leave balances.
        </p>
      ) : (
        <LeaveRequestForm leaveTypes={leaveTypes} />
      )}
    </div>
  );
}
