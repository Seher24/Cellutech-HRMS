import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildOrgTree } from "@/lib/org/hierarchy";
import { OrgTree } from "@/components/org-chart/org-tree";

export default async function OrgChartPage({
  searchParams,
}: {
  searchParams: Promise<{ subsidiaryId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;

  const subsidiaries = await prisma.subsidiary.findMany({
    include: { country: true },
    orderBy: { name: "asc" },
  });

  const subsidiaryId =
    session.user.role === RoleName.SUPER_ADMIN
      ? params.subsidiaryId || subsidiaries[0]?.id
      : session.user.subsidiaryId;

  const tree = await buildOrgTree(subsidiaryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Organization chart</h2>
          <p className="text-sm text-slate-500">
            Reporting hierarchy driven by each employee&apos;s manager
          </p>
        </div>
        {session.user.role === RoleName.SUPER_ADMIN && (
          <form className="flex gap-2">
            <select
              name="subsidiaryId"
              defaultValue={subsidiaryId ?? ""}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.country.code})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-9 rounded-lg bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
            >
              View
            </button>
          </form>
        )}
      </div>
      <OrgTree nodes={tree} />
    </div>
  );
}
