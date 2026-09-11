import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LeaveOverlapCalendar } from "@/components/leave/leave-overlap-calendar";

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart <= bEnd && bStart <= aEnd;
}

export default async function LeaveCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canView =
    session.user.role === RoleName.SUPER_ADMIN ||
    session.user.role === RoleName.HR_MANAGER ||
    session.user.role === RoleName.DEPARTMENT_HEAD ||
    session.user.role === RoleName.TEAM_LEAD;
  if (!canView) redirect("/dashboard");

  const where =
    session.user.role === RoleName.SUPER_ADMIN
      ? { status: "APPROVED" as const }
      : session.user.role === RoleName.TEAM_LEAD
        ? {
            status: "APPROVED" as const,
            user: { managerId: session.user.id },
          }
        : session.user.role === RoleName.DEPARTMENT_HEAD
          ? {
              status: "APPROVED" as const,
              user: {
                subsidiaryId: session.user.subsidiaryId,
                ...(session.user.departmentId
                  ? { departmentId: session.user.departmentId }
                  : {}),
              },
            }
          : {
              // HR_MANAGER — subsidiary-wide coverage
              status: "APPROVED" as const,
              user: { subsidiaryId: session.user.subsidiaryId },
            };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: { include: { department: true } },
      leaveType: true,
    },
    orderBy: { startDate: "asc" },
    take: 80,
  });

  const items = leaves.map((l) => {
    const overlapsWith = leaves
      .filter(
        (other) =>
          other.id !== l.id &&
          rangesOverlap(l.startDate, l.endDate, other.startDate, other.endDate)
      )
      .map((other) => `${other.user.firstName} ${other.user.lastName}`);

    return {
      id: l.id,
      employee: `${l.user.firstName} ${l.user.lastName}`,
      department: l.user.department?.name ?? "-",
      leaveType: l.leaveType.name,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate.toISOString().slice(0, 10),
      totalDays: l.totalDays,
      overlapsWith,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Leave calendar</h2>
        <p className="text-sm text-slate-500">
          Approved leave in your scope with overlap highlighting for coverage planning
        </p>
      </div>
      <LeaveOverlapCalendar items={items} />
    </div>
  );
}
