import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { PolicyVault } from "@/components/policies/policy-vault";

export default async function PoliciesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canManage = hasPermission(session.user.role, "manage_announcements");

  const subsidiaries = await prisma.subsidiary.findMany({
    where:
      session.user.role === RoleName.SUPER_ADMIN
        ? { isActive: true }
        : { id: session.user.subsidiaryId ?? undefined },
    orderBy: { name: "asc" },
  });

  const policies = await prisma.policyDocument.findMany({
    where:
      session.user.role === RoleName.SUPER_ADMIN
        ? {}
        : {
            OR: [
              { scope: "GLOBAL" },
              { subsidiaryId: session.user.subsidiaryId },
            ],
          },
    include: { subsidiary: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Document vault</h2>
        <p className="text-sm text-slate-500">
          Central repository for HR policies, handbooks, and company documents
        </p>
      </div>
      <PolicyVault
        canManage={canManage}
        isSuperAdmin={session.user.role === RoleName.SUPER_ADMIN}
        subsidiaries={subsidiaries.map((s) => ({ id: s.id, name: s.name }))}
        defaultSubsidiaryId={session.user.subsidiaryId}
        items={policies.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          description: p.description,
          fileName: p.fileName,
          scope: p.scope,
          subsidiaryName: p.subsidiary?.name ?? null,
          createdAt: p.createdAt.toLocaleString(),
        }))}
      />
    </div>
  );
}
