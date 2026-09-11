import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary, hasPermission } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { DeactivateEmployeeButton } from "@/components/employees/deactivate-button";
import { EmployeeDocumentsPanel } from "@/components/employees/employee-documents";
import { getManagerChain } from "@/lib/org/hierarchy";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      subsidiary: { include: { country: true } },
      department: true,
      designation: true,
      manager: true,
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!employee) notFound();

  const isSelf = session.user.id === employee.id;
  const canManage = hasPermission(session.user.role, "manage_employees");
  if (
    !isSelf &&
    !canManage &&
    session.user.role !== "DEPARTMENT_HEAD" &&
    session.user.role !== "TEAM_LEAD" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    redirect("/employees");
  }
  if (
    canManage &&
    !isSelf &&
    !canAccessSubsidiary(session.user, employee.subsidiaryId)
  ) {
    redirect("/employees");
  }

  const chain = await getManagerChain(employee.id);
  const canUpload = isSelf || canManage;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-slate-500">{employee.email}</p>
          </div>
          <Badge variant="secondary">{employee.status}</Badge>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium">{employee.role.name.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Designation</dt>
            <dd className="font-medium">{employee.designation?.title ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Subsidiary</dt>
            <dd className="font-medium">
              {employee.subsidiary
                ? `${employee.subsidiary.name}, ${employee.subsidiary.country.name}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Department</dt>
            <dd className="font-medium">{employee.department?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Manager</dt>
            <dd className="font-medium">
              {employee.manager
                ? `${employee.manager.firstName} ${employee.manager.lastName}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Joined</dt>
            <dd className="font-medium">
              {employee.joiningDate.toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="font-medium">{employee.phone ?? "-"}</dd>
          </div>
        </dl>
        {canManage && employee.status !== "TERMINATED" && !isSelf && (
          <div className="mt-6">
            <DeactivateEmployeeButton userId={employee.id} />
          </div>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">Manager chain</h3>
        <ol className="mt-3 space-y-2 text-sm">
          {chain.length === 0 && (
            <li className="text-slate-500">Top of reporting chain</li>
          )}
          {chain.map((m, idx) => (
            <li key={m.id}>
              {idx + 1}. {m.name} ({m.email})
            </li>
          ))}
        </ol>
      </div>
      <EmployeeDocumentsPanel
        userId={employee.id}
        canUpload={canUpload}
        documents={employee.documents.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          fileName: d.fileName,
          sizeBytes: d.sizeBytes,
          createdAt: d.createdAt.toLocaleString(),
        }))}
      />
    </div>
  );
}
