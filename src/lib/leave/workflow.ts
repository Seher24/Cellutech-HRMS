import {
  ApprovalDecision,
  LeaveRequestStatus,
  Prisma,
  RoleName,
} from "@prisma/client";
import { eachDayOfInterval, isSaturday, isSunday, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac";
import { canAccessSubsidiary, hasPermission } from "@/lib/rbac";

export async function countWorkingDays(
  startDate: Date,
  endDate: Date,
  subsidiaryId: string | null
) {
  const holidays = subsidiaryId
    ? await prisma.holiday.findMany({
        where: {
          subsidiaryId,
          date: {
            gte: startOfDay(startDate),
            lte: startOfDay(endDate),
          },
        },
      })
    : [];

  const holidayKeys = new Set(
    holidays.map((h) => startOfDay(h.date).toISOString())
  );

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter((day) => {
    if (isSaturday(day) || isSunday(day)) return false;
    return !holidayKeys.has(startOfDay(day).toISOString());
  }).length;
}

async function findDepartmentHead(departmentId: string | null, excludeUserId?: string) {
  if (!departmentId) return null;
  return prisma.user.findFirst({
    where: {
      departmentId,
      status: "ACTIVE",
      role: { name: RoleName.DEPARTMENT_HEAD },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

async function notify(userId: string, title: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, title, message, link },
  });
}

export async function submitLeaveRequest(input: {
  actor: SessionUser;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}) {
  if (!hasPermission(input.actor.role, "apply_leave")) {
    throw new Error("Forbidden");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.actor.id },
    include: { manager: true },
  });
  if (!user) throw new Error("User not found");
  if (!user.managerId) throw new Error("No manager assigned - contact HR");

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: input.leaveTypeId },
  });
  if (!leaveType || !leaveType.isActive) throw new Error("Invalid leave type");

  const totalDays = await countWorkingDays(
    input.startDate,
    input.endDate,
    user.subsidiaryId
  );
  if (totalDays <= 0) throw new Error("Selected range has no working days");

  const year = input.startDate.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveTypeId_year: {
        userId: user.id,
        leaveTypeId: leaveType.id,
        year,
      },
    },
  });

  if (!balance || balance.allotted - balance.used < totalDays) {
    throw new Error("Insufficient leave balance");
  }

  const request = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      leaveTypeId: leaveType.id,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays,
      reason: input.reason,
      status: LeaveRequestStatus.PENDING,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: user.managerId,
          level: 1,
          decision: ApprovalDecision.PENDING,
        },
      },
    },
    include: { leaveType: true },
  });

  await notify(
    user.managerId,
    "Leave approval needed",
    `${user.firstName} ${user.lastName} requested ${totalDays} day(s) of ${leaveType.name}.`,
    "/leave/approvals"
  );

  return request;
}

function needsEscalation(
  totalDays: number,
  leaveType: { requiresEscalation: boolean; escalationThresholdDays: number }
) {
  return leaveType.requiresEscalation || totalDays > leaveType.escalationThresholdDays;
}

export async function decideLeaveRequest(input: {
  actor: SessionUser;
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string;
  override?: boolean;
}) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: input.requestId },
    include: {
      user: true,
      leaveType: true,
      approvalSteps: { orderBy: { level: "asc" } },
    },
  });

  if (!request) throw new Error("Leave request not found");
  if (
    request.status !== LeaveRequestStatus.PENDING &&
    request.status !== LeaveRequestStatus.PENDING_L2
  ) {
    throw new Error("Request is not awaiting approval");
  }

  const isHrOverride =
    !!input.override && hasPermission(input.actor.role, "hr_override_leave");

  if (isHrOverride) {
    if (!canAccessSubsidiary(input.actor, request.user.subsidiaryId)) {
      throw new Error("Forbidden: subsidiary scope");
    }
  } else {
    const pendingStep = request.approvalSteps.find(
      (s) => s.decision === ApprovalDecision.PENDING
    );
    if (!pendingStep || pendingStep.approverId !== input.actor.id) {
      throw new Error("You are not the current approver");
    }
  }

  if (input.decision === "REJECTED") {
    await prisma.$transaction(async (tx) => {
      const pending = request.approvalSteps.find(
        (s) => s.decision === ApprovalDecision.PENDING
      );
      if (pending) {
        await tx.leaveApprovalStep.update({
          where: { id: pending.id },
          data: {
            decision: ApprovalDecision.REJECTED,
            comment: input.comment,
            decidedAt: new Date(),
            ...(isHrOverride ? { approverId: input.actor.id } : {}),
          },
        });
      } else if (isHrOverride) {
        await tx.leaveApprovalStep.create({
          data: {
            leaveRequestId: request.id,
            approverId: input.actor.id,
            level: request.currentApprovalStep + 1,
            decision: ApprovalDecision.REJECTED,
            comment: input.comment ?? "HR override rejection",
            decidedAt: new Date(),
          },
        });
      }

      await tx.leaveRequest.update({
        where: { id: request.id },
        data: { status: LeaveRequestStatus.REJECTED },
      });
    });

    await notify(
      request.userId,
      "Leave rejected",
      `Your ${request.leaveType.name} request was rejected.`,
      "/leave/my-requests"
    );
    return;
  }

  // APPROVED path
  const escalate = needsEscalation(request.totalDays, request.leaveType);
  const isLevel1 =
    request.status === LeaveRequestStatus.PENDING && !isHrOverride;

  if (isLevel1 && escalate) {
    const deptHead = await findDepartmentHead(
      request.user.departmentId,
      request.userId
    );
    if (!deptHead) {
      throw new Error("No department head found for escalation");
    }

    await prisma.$transaction(async (tx) => {
      const pending = request.approvalSteps.find(
        (s) => s.decision === ApprovalDecision.PENDING && s.level === 1
      );
      if (pending) {
        await tx.leaveApprovalStep.update({
          where: { id: pending.id },
          data: {
            decision: ApprovalDecision.APPROVED,
            comment: input.comment,
            decidedAt: new Date(),
          },
        });
      }

      await tx.leaveApprovalStep.create({
        data: {
          leaveRequestId: request.id,
          approverId: deptHead.id,
          level: 2,
          decision: ApprovalDecision.PENDING,
        },
      });

      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: LeaveRequestStatus.PENDING_L2,
          currentApprovalStep: 2,
        },
      });
    });

    await notify(
      deptHead.id,
      "Escalated leave approval",
      `${request.user.firstName} ${request.user.lastName}'s leave needs Level-2 approval.`,
      "/leave/approvals"
    );
    await notify(
      request.userId,
      "Leave escalated",
      "Your leave was approved by your manager and escalated for final approval.",
      "/leave/my-requests"
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    const pending = request.approvalSteps.find(
      (s) => s.decision === ApprovalDecision.PENDING
    );
    if (pending) {
      await tx.leaveApprovalStep.update({
        where: { id: pending.id },
        data: {
          decision: ApprovalDecision.APPROVED,
          comment: input.comment,
          decidedAt: new Date(),
          ...(isHrOverride ? { approverId: input.actor.id } : {}),
        },
      });
    } else if (isHrOverride) {
      await tx.leaveApprovalStep.create({
        data: {
          leaveRequestId: request.id,
          approverId: input.actor.id,
          level: request.currentApprovalStep + 1,
          decision: ApprovalDecision.APPROVED,
          comment: input.comment ?? "HR override approval",
          decidedAt: new Date(),
        },
      });
    }

    await tx.leaveRequest.update({
      where: { id: request.id },
      data: { status: LeaveRequestStatus.APPROVED },
    });

    const year = request.startDate.getFullYear();
    await tx.leaveBalance.update({
      where: {
        userId_leaveTypeId_year: {
          userId: request.userId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
      },
      data: { used: { increment: request.totalDays } },
    });
  });

  await notify(
    request.userId,
    "Leave approved",
    `Your ${request.leaveType.name} request (${request.totalDays} day(s)) was approved.`,
    "/leave/my-requests"
  );
}

export async function getPendingApprovalsFor(actor: SessionUser) {
  const where: Prisma.LeaveRequestWhereInput = {
    status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.PENDING_L2] },
  };

  if (actor.role === RoleName.SUPER_ADMIN) {
    // all
  } else if (
    actor.role === RoleName.HR_MANAGER &&
    hasPermission(actor.role, "hr_override_leave")
  ) {
    where.user = { subsidiaryId: actor.subsidiaryId };
  } else {
    where.approvalSteps = {
      some: {
        approverId: actor.id,
        decision: ApprovalDecision.PENDING,
      },
    };
  }

  return prisma.leaveRequest.findMany({
    where,
    include: {
      user: {
        include: {
          department: true,
          subsidiary: true,
        },
      },
      leaveType: true,
      approvalSteps: {
        include: { approver: true },
        orderBy: { level: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function cancelLeaveRequest(input: {
  actor: SessionUser;
  requestId: string;
}) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: input.requestId },
    include: { leaveType: true, approvalSteps: true },
  });

  if (!request) throw new Error("Leave request not found");
  if (request.userId !== input.actor.id) {
    throw new Error("You can only cancel your own leave requests");
  }

  const cancellable =
    request.status === LeaveRequestStatus.PENDING ||
    request.status === LeaveRequestStatus.PENDING_L2 ||
    request.status === LeaveRequestStatus.APPROVED;

  if (!cancellable) {
    throw new Error("This leave request cannot be cancelled");
  }

  if (request.status === LeaveRequestStatus.APPROVED) {
    const today = startOfDay(new Date());
    if (startOfDay(request.startDate) <= today) {
      throw new Error("Cannot cancel leave that has already started");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id: request.id },
      data: { status: LeaveRequestStatus.CANCELLED },
    });

    await tx.leaveApprovalStep.updateMany({
      where: {
        leaveRequestId: request.id,
        decision: ApprovalDecision.PENDING,
      },
      data: {
        decision: ApprovalDecision.REJECTED,
        comment: "Cancelled by employee",
        decidedAt: new Date(),
      },
    });

    if (request.status === LeaveRequestStatus.APPROVED) {
      const year = request.startDate.getFullYear();
      await tx.leaveBalance.update({
        where: {
          userId_leaveTypeId_year: {
            userId: request.userId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
        data: { used: { decrement: request.totalDays } },
      });
    }
  });

  const pendingApprovers = request.approvalSteps
    .filter((s) => s.decision === ApprovalDecision.PENDING)
    .map((s) => s.approverId);

  for (const approverId of pendingApprovers) {
    await notify(
      approverId,
      "Leave cancelled",
      `A leave request was withdrawn by the employee.`,
      "/leave/approvals"
    );
  }
}
