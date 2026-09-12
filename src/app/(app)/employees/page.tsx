import Link from "next/link";
import { RoleName } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeCreateForm } from "@/components/employees/employee-create-form";
import { ResponsiveTable } from "@/components/ui/responsive-table";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subsidiaryId?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;

  const canManage = hasPermission(session.user.role, "manage_employees");

  const where = {
    ...(session.user.role === RoleName.SUPER_ADMIN
      ? {}
      : session.user.role === RoleName.HR_MANAGER ||
          session.user.role === RoleName.FINANCE
        ? { subsidiaryId: session.user.subsidiaryId }
        : session.user.role === RoleName.DEPARTMENT_HEAD
          ? { departmentId: session.user.departmentId }
          : session.user.role === RoleName.TEAM_LEAD
            ? {
                OR: [{ managerId: session.user.id }, { id: session.user.id }],
              }
            : { id: session.user.id }),
    ...(params.subsidiaryId ? { subsidiaryId: params.subsidiaryId } : {}),
    ...(params.status
      ? { status: params.status as "ACTIVE" | "ON_LEAVE" | "TERMINATED" }
      : {}),
    ...(params.q
      ? {
          OR: [
            { firstName: { contains: params.q } },
            { lastName: { contains: params.q } },
            { email: { contains: params.q } },
          ],
        }
      : {}),
  };

  const [employees, subsidiaries, departments, designations, managers, roles] =
    await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          subsidiary: true,
          department: true,
          designation: true,
          manager: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      prisma.subsidiary.findMany({
        where:
          session.user.role === RoleName.SUPER_ADMIN
            ? {}
            : { id: session.user.subsidiaryId ?? undefined },
        include: { country: true },
      }),
      prisma.department.findMany({
        where:
          session.user.role === RoleName.SUPER_ADMIN
            ? {}
            : { subsidiaryId: session.user.subsidiaryId ?? undefined },
      }),
      prisma.designation.findMany(),
      prisma.user.findMany({
        where: {
          status: "ACTIVE",
          role: {
            name: {
              in: [
                RoleName.SUPER_ADMIN,
                RoleName.HR_MANAGER,
                RoleName.DEPARTMENT_HEAD,
                RoleName.TEAM_LEAD,
              ],
            },
          },
          ...(session.user.role === RoleName.SUPER_ADMIN
            ? {}
            : { subsidiaryId: session.user.subsidiaryId }),
        },
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.role.findMany(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Employees</h2>
          <p className="text-sm text-slate-500">
            Directory with search and scope-aware filters
          </p>
        </div>
        <Link href="/employees/me">
          <Button variant="outline" className="w-full sm:w-auto">
            My profile
          </Button>
        </Link>
      </div>

      <form className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name or email"
          className="h-9 w-full min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm sm:min-w-[12rem]"
        />
        {session.user.role === RoleName.SUPER_ADMIN && (
          <select
            name="subsidiaryId"
            defaultValue={params.subsidiaryId ?? ""}
            className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm sm:w-auto"
          >
            <option value="">All subsidiaries</option>
            {subsidiaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm sm:w-auto"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 sm:w-auto">
          Filter
        </Button>
      </form>

      <ResponsiveTable>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Subsidiary</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {e.firstName} {e.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{e.email}</div>
                </td>
                <td className="px-4 py-3">{e.role.name.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">{e.subsidiary?.name ?? "-"}</td>
                <td className="px-4 py-3">{e.department?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {e.manager
                    ? `${e.manager.firstName} ${e.manager.lastName}`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{e.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/employees/${e.id}`}
                    className="text-teal-700 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>

      {canManage && (
        <EmployeeCreateForm
          subsidiaries={subsidiaries.map((s) => ({
            id: s.id,
            name: s.name,
          }))}
          departments={departments.map((d) => ({
            id: d.id,
            name: d.name,
            subsidiaryId: d.subsidiaryId,
          }))}
          designations={designations.map((d) => ({
            id: d.id,
            title: d.title,
            departmentId: d.departmentId,
          }))}
          managers={managers.map((m) => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
          }))}
          roles={roles
            .filter((r) =>
              session.user.role === RoleName.SUPER_ADMIN
                ? true
                : r.name !== RoleName.SUPER_ADMIN
            )
            .map((r) => ({ name: r.name, label: r.name.replaceAll("_", " ") }))}
        />
      )}
    </div>
  );
}
