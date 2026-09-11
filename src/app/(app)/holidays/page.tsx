import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { HolidayForm } from "@/components/holidays/holiday-form";

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ subsidiaryId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;

  const subsidiaries = await prisma.subsidiary.findMany({
    where:
      session.user.role === RoleName.SUPER_ADMIN
        ? {}
        : { id: session.user.subsidiaryId ?? undefined },
    include: { country: true },
  });

  const subsidiaryId =
    session.user.role === RoleName.SUPER_ADMIN
      ? params.subsidiaryId || subsidiaries[0]?.id
      : session.user.subsidiaryId;

  const holidays = await prisma.holiday.findMany({
    where: { subsidiaryId: subsidiaryId ?? undefined },
    orderBy: { date: "asc" },
  });

  const canManage = hasPermission(session.user.role, "manage_holidays");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Holiday calendar</h2>
          <p className="text-sm text-slate-500">
            Subsidiary-specific public holidays excluded from leave calculations
          </p>
        </div>
        {session.user.role === RoleName.SUPER_ADMIN && (
          <form className="flex gap-2">
            <select
              name="subsidiaryId"
              defaultValue={subsidiaryId ?? ""}
              className="h-9 rounded-lg border bg-white px-3 text-sm"
            >
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="submit" className="h-9 rounded-lg bg-teal-700 px-3 text-sm text-white">
              View
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Holiday</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                  No holidays configured.
                </td>
              </tr>
            )}
            {holidays.map((h) => (
              <tr key={h.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{h.name}</td>
                <td className="px-4 py-3">{h.date.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && subsidiaryId && (
        <HolidayForm
          subsidiaryId={subsidiaryId}
          subsidiaries={subsidiaries.map((s) => ({ id: s.id, name: s.name }))}
          lockSubsidiary={session.user.role !== RoleName.SUPER_ADMIN}
        />
      )}
    </div>
  );
}
