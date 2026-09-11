import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrganizationForms } from "@/components/organization/organization-forms";

export default async function OrganizationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== RoleName.SUPER_ADMIN &&
    session.user.role !== RoleName.HR_MANAGER
  ) {
    redirect("/dashboard");
  }

  const [companies, countries, subsidiaries, departments] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.subsidiary.findMany({
      where:
        session.user.role === RoleName.SUPER_ADMIN
          ? {}
          : { id: session.user.subsidiaryId ?? undefined },
      include: {
        country: true,
        company: true,
        _count: { select: { departments: true, users: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where:
        session.user.role === RoleName.SUPER_ADMIN
          ? {}
          : { subsidiaryId: session.user.subsidiaryId ?? undefined },
      include: {
        subsidiary: true,
        designations: {
          include: { _count: { select: { users: true } } },
          orderBy: { title: "asc" },
        },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Organization</h2>
        <p className="text-sm text-slate-500">
          Company, countries, subsidiaries, departments, and designations
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {companies.map((c) => (
              <li key={c.id}>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">{c.legalName ?? "Parent entity"}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Countries</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {countries.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.name}</span>
                <span className="text-slate-500">{c.code}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Subsidiaries</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {subsidiaries.map((s) => (
              <li key={s.id}>
                <div className="font-medium">
                  {s.name}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({s.isActive ? "Active" : "Inactive"})
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {s.company.name} · {s.city}, {s.country.name} · {s.currency} · {s.timezone} ·{" "}
                  {s._count.users} employees
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Departments & designations</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {departments.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-100 p-3">
              <div className="font-medium">
                {d.name}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({d.subsidiary.name})
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {d._count.users} employees ·{" "}
                {d.designations.map((x) => x.title).join(", ") || "No designations"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OrganizationForms
        isSuperAdmin={session.user.role === RoleName.SUPER_ADMIN}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        countries={countries.map((c) => ({ id: c.id, name: c.name }))}
        subsidiaries={subsidiaries.map((s) => ({ id: s.id, name: s.name }))}
        subsidiaryDetails={subsidiaries.map((s) => ({
          id: s.id,
          name: s.name,
          city: s.city,
          timezone: s.timezone,
          currency: s.currency,
          isActive: s.isActive,
        }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        departmentDetails={departments.map((d) => ({
          id: d.id,
          name: d.name,
          subsidiaryName: d.subsidiary.name,
          employeeCount: d._count.users,
          designations: d.designations.map((des) => ({
            id: des.id,
            title: des.title,
            employeeCount: des._count.users,
          })),
        }))}
        defaultSubsidiaryId={session.user.subsidiaryId}
      />
    </div>
  );
}
