import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/employees/profile-form";
import { ChangePasswordForm } from "@/components/employees/change-password-form";

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: true,
      subsidiary: true,
      department: true,
      designation: true,
      manager: true,
    },
  });

  if (!me) redirect("/login");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">My profile</h2>
        <p className="text-sm text-slate-500">Update your personal details and password</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="mb-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="break-all text-right">{me.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Role</dt>
            <dd>{me.role.name.replaceAll("_", " ")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Subsidiary</dt>
            <dd>{me.subsidiary?.name ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Department</dt>
            <dd>{me.department?.name ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Manager</dt>
            <dd>
              {me.manager
                ? `${me.manager.firstName} ${me.manager.lastName}`
                : "-"}
            </dd>
          </div>
        </dl>
        <ProfileForm
          firstName={me.firstName}
          lastName={me.lastName}
          phone={me.phone ?? ""}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
