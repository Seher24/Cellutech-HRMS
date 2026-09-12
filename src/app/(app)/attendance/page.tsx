import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { ResponsiveTable } from "@/components/ui/responsive-table";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userFilter =
    session.user.role === RoleName.SUPER_ADMIN
      ? {}
      : session.user.role === RoleName.HR_MANAGER ||
          session.user.role === RoleName.FINANCE
        ? { subsidiaryId: session.user.subsidiaryId }
        : session.user.role === RoleName.DEPARTMENT_HEAD
          ? { departmentId: session.user.departmentId }
          : session.user.role === RoleName.TEAM_LEAD
            ? { OR: [{ managerId: session.user.id }, { id: session.user.id }] }
            : { id: session.user.id };

  const subsidiary = session.user.subsidiaryId
    ? await prisma.subsidiary.findUnique({
        where: { id: session.user.subsidiaryId },
        select: { timezone: true },
      })
    : null;
  const timeZone = subsidiary?.timezone ?? "Asia/Karachi";

  const [records, myToday] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: { gte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
        user: userFilter,
      },
      include: { user: true },
      orderBy: [{ date: "desc" }, { user: { lastName: "asc" } }],
      take: 200,
    }),
    prisma.attendance.findUnique({
      where: {
        userId_date: { userId: session.user.id, date: today },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Attendance and timesheet
        </h2>
        <p className="text-sm text-slate-500">
          Daily status plus check-in / check-out timestamps for payroll-ready records
        </p>
      </div>

      <AttendanceForm
        userId={session.user.id}
        currentStatus={myToday?.status ?? null}
        checkInAt={myToday?.checkInAt ? formatTime(myToday.checkInAt, timeZone) : null}
        checkOutAt={
          myToday?.checkOutAt ? formatTime(myToday.checkOutAt, timeZone) : null
        }
      />

      <ResponsiveTable>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check in</th>
              <th className="px-4 py-3">Check out</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No attendance records in the last 14 days.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  {r.user.firstName} {r.user.lastName}
                </td>
                <td className="px-4 py-3">{formatDate(r.date, timeZone)}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">
                  {r.checkInAt ? formatTime(r.checkInAt, timeZone) : "-"}
                </td>
                <td className="px-4 py-3">
                  {r.checkOutAt ? formatTime(r.checkOutAt, timeZone) : "-"}
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3 text-slate-500">
                  {r.note ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>
    </div>
  );
}
