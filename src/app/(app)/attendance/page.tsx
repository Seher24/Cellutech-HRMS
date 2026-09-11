import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AttendanceForm } from "@/components/attendance/attendance-form";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userFilter =
    session.user.role === RoleName.SUPER_ADMIN
      ? {}
      : session.user.role === RoleName.HR_MANAGER
        ? { subsidiaryId: session.user.subsidiaryId }
        : session.user.role === RoleName.DEPARTMENT_HEAD
          ? { departmentId: session.user.departmentId }
          : session.user.role === RoleName.TEAM_LEAD
            ? { OR: [{ managerId: session.user.id }, { id: session.user.id }] }
            : { id: session.user.id };

  const [records, myToday] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        user: userFilter,
      },
      include: { user: true },
      orderBy: [{ date: "desc" }, { user: { lastName: "asc" } }],
      take: 100,
    }),
    prisma.attendance.findUnique({
      where: {
        userId_date: { userId: session.user.id, date: today },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Attendance</h2>
        <p className="text-sm text-slate-500">
          Simplified daily status (present / absent / leave / holiday / remote)
        </p>
      </div>

      <AttendanceForm
        userId={session.user.id}
        currentStatus={myToday?.status ?? null}
      />

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No attendance records in the last 7 days.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  {r.user.firstName} {r.user.lastName}
                </td>
                <td className="px-4 py-3">{r.date.toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-slate-500">{r.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
