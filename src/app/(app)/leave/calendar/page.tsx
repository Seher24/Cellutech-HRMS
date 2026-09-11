import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { RoleName } from "@prisma/client";

export default async function LeaveCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const where =
    session.user.role === RoleName.SUPER_ADMIN
      ? { status: "APPROVED" as const }
      : session.user.role === RoleName.TEAM_LEAD
        ? {
            status: "APPROVED" as const,
            user: { managerId: session.user.id },
          }
        : {
            status: "APPROVED" as const,
            user: {
              subsidiaryId: session.user.subsidiaryId,
              ...(session.user.role === RoleName.DEPARTMENT_HEAD &&
              session.user.departmentId
                ? { departmentId: session.user.departmentId }
                : {}),
            },
          };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      user: { include: { department: true } },
      leaveType: true,
    },
    orderBy: { startDate: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Leave calendar</h2>
        <p className="text-sm text-slate-500">
          Approved leave in your scope - use this to plan coverage
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Department</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No approved leave in this view.
                </td>
              </tr>
            )}
            {leaves.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">
                  {l.user.firstName} {l.user.lastName}
                </td>
                <td className="px-4 py-3">{l.leaveType.name}</td>
                <td className="px-4 py-3">
                  {l.startDate.toLocaleDateString()} - {l.endDate.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{l.totalDays}</td>
                <td className="px-4 py-3">{l.user.department?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
