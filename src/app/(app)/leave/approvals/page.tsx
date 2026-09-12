import { RoleName } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingApprovalsFor } from "@/lib/leave/workflow";
import { hasPermission } from "@/lib/rbac";
import { ApprovalsList } from "@/components/leave/approvals-list";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (
    role !== RoleName.SUPER_ADMIN &&
    role !== RoleName.HR_MANAGER &&
    role !== RoleName.DEPARTMENT_HEAD &&
    role !== RoleName.TEAM_LEAD
  ) {
    redirect("/dashboard");
  }

  const pending = await getPendingApprovalsFor(session.user);
  const canOverride = hasPermission(role, "hr_override_leave");

  const items = pending.map((r) => {
    const current = r.approvalSteps.find((s) => s.decision === "PENDING");
    return {
      id: r.id,
      totalDays: r.totalDays,
      reason: r.reason,
      status: r.status,
      startDate: r.startDate.toLocaleDateString(),
      endDate: r.endDate.toLocaleDateString(),
      leaveType: r.leaveType.name,
      employee: `${r.user.firstName} ${r.user.lastName}`,
      department: r.user.department?.name ?? null,
      canOverride,
      isCurrentApprover: current?.approverId === session.user.id,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Leave approvals</h2>
        <p className="text-sm text-slate-500">
          Level-1 manager approval with automatic escalation when required
        </p>
      </div>
      <ApprovalsList items={items} />
    </div>
  );
}
