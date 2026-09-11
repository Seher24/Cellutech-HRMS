import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnnouncementManager } from "@/components/announcements/announcement-manager";

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== RoleName.SUPER_ADMIN &&
    session.user.role !== RoleName.HR_MANAGER
  ) {
    redirect("/dashboard");
  }

  const subsidiaries = await prisma.subsidiary.findMany({
    where:
      session.user.role === RoleName.SUPER_ADMIN
        ? {}
        : { id: session.user.subsidiaryId ?? undefined },
    orderBy: { name: "asc" },
  });

  const announcements = await prisma.announcement.findMany({
    where:
      session.user.role === RoleName.SUPER_ADMIN
        ? {}
        : {
            OR: [
              { scope: "GLOBAL" },
              { subsidiaryId: session.user.subsidiaryId },
            ],
          },
    include: {
      createdBy: true,
      subsidiary: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Announcements</h2>
        <p className="text-sm text-slate-500">
          Post global or subsidiary-scoped updates for employees
        </p>
      </div>
      <AnnouncementManager
        isSuperAdmin={session.user.role === RoleName.SUPER_ADMIN}
        subsidiaries={subsidiaries.map((s) => ({ id: s.id, name: s.name }))}
        defaultSubsidiaryId={session.user.subsidiaryId}
        items={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          scope: a.scope,
          subsidiaryName: a.subsidiary?.name ?? null,
          createdAt: a.createdAt.toLocaleString(),
          author: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
        }))}
      />
    </div>
  );
}
