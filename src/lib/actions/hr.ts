"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { EmploymentStatus, RoleName } from "@prisma/client";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary, hasPermission, requirePermission } from "@/lib/rbac";

const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  roleName: z.enum([
    "SUPER_ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_HEAD",
    "TEAM_LEAD",
    "EMPLOYEE",
  ]),
  subsidiaryId: z.string().min(1),
  departmentId: z.string().min(1),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  joiningDate: z.string().min(1),
  password: z.string().min(8).optional(),
});

export async function createEmployeeAction(input: z.infer<typeof employeeSchema>) {
  const actor = await requireSession();
  requirePermission(actor, "manage_employees");
  const data = employeeSchema.parse(input);

  if (!canAccessSubsidiary(actor, data.subsidiaryId)) {
    return { error: "Forbidden: subsidiary scope" };
  }

  if (data.roleName === RoleName.SUPER_ADMIN && actor.role !== RoleName.SUPER_ADMIN) {
    return { error: "Only Super Admin can create Super Admin users" };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return { error: "Email already in use" };

  const role = await prisma.role.findUnique({ where: { name: data.roleName } });
  if (!role) return { error: "Invalid role" };

  const password = data.password ?? "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      joiningDate: new Date(data.joiningDate),
      roleId: role.id,
      subsidiaryId: data.subsidiaryId,
      departmentId: data.departmentId,
      designationId: data.designationId || null,
      managerId: data.managerId || null,
      status: EmploymentStatus.ACTIVE,
    },
  });

  const year = new Date().getFullYear();
  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
  await prisma.leaveBalance.createMany({
    data: leaveTypes.map((lt) => ({
      userId: user.id,
      leaveTypeId: lt.id,
      year,
      allotted: lt.defaultAnnualQuota,
      used: 0,
    })),
  });

  revalidatePath("/employees");
  revalidatePath("/org-chart");
  revalidatePath("/dashboard");
  return { success: true, temporaryPassword: password };
}

export async function deactivateEmployeeAction(userId: string) {
  const actor = await requireSession();
  requirePermission(actor, "manage_employees");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Employee not found" };
  if (!canAccessSubsidiary(actor, target.subsidiaryId)) {
    return { error: "Forbidden: subsidiary scope" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: EmploymentStatus.TERMINATED },
  });

  revalidatePath("/employees");
  revalidatePath("/org-chart");
  return { success: true };
}

export async function updateOwnProfileAction(input: {
  phone?: string;
  firstName: string;
  lastName: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "edit_own_profile");

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  revalidatePath("/employees/me");
  revalidatePath("/dashboard");
  return { success: true };
}

const orgSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  countryId: z.string().min(1),
  companyId: z.string().min(1),
  timezone: z.string().min(1),
  currency: z.string().min(1),
});

export async function createSubsidiaryAction(input: z.infer<typeof orgSchema>) {
  const actor = await requireSession();
  requirePermission(actor, "manage_subsidiaries");
  const data = orgSchema.parse(input);
  await prisma.subsidiary.create({ data });
  revalidatePath("/organization");
  return { success: true };
}

export async function updateSubsidiaryAction(input: {
  id: string;
  name: string;
  city: string;
  timezone: string;
  currency: string;
  isActive: boolean;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_subsidiaries");
  await prisma.subsidiary.update({
    where: { id: input.id },
    data: {
      name: input.name,
      city: input.city,
      timezone: input.timezone,
      currency: input.currency,
      isActive: input.isActive,
    },
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function createCompanyAction(input: {
  name: string;
  legalName?: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_countries");
  await prisma.company.create({
    data: { name: input.name, legalName: input.legalName || null },
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function createCountryAction(input: { name: string; code: string }) {
  const actor = await requireSession();
  requirePermission(actor, "manage_countries");
  await prisma.country.create({
    data: { name: input.name, code: input.code.toUpperCase() },
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function createDepartmentAction(input: {
  name: string;
  subsidiaryId: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_departments");
  if (!canAccessSubsidiary(actor, input.subsidiaryId)) {
    return { error: "Forbidden: subsidiary scope" };
  }
  await prisma.department.create({
    data: { name: input.name, subsidiaryId: input.subsidiaryId },
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function createDesignationAction(input: {
  title: string;
  departmentId: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_departments");
  const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!dept) return { error: "Department not found" };
  if (!canAccessSubsidiary(actor, dept.subsidiaryId)) {
    return { error: "Forbidden: subsidiary scope" };
  }
  await prisma.designation.create({
    data: { title: input.title, departmentId: input.departmentId },
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function createHolidayAction(input: {
  subsidiaryId: string;
  name: string;
  date: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_holidays");
  if (!canAccessSubsidiary(actor, input.subsidiaryId)) {
    return { error: "Forbidden" };
  }
  await prisma.holiday.create({
    data: {
      subsidiaryId: input.subsidiaryId,
      name: input.name,
      date: new Date(input.date),
    },
  });
  revalidatePath("/holidays");
  return { success: true };
}

export async function upsertAttendanceAction(input: {
  userId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY" | "REMOTE";
  note?: string;
  checkInAt?: string;
  checkOutAt?: string;
}) {
  const actor = await requireSession();
  if (
    actor.id !== input.userId &&
    !hasPermission(actor.role, "view_attendance")
  ) {
    return { error: "Forbidden" };
  }

  const date = new Date(input.date);
  date.setHours(0, 0, 0, 0);

  const checkInAt = input.checkInAt ? new Date(input.checkInAt) : undefined;
  const checkOutAt = input.checkOutAt ? new Date(input.checkOutAt) : undefined;

  await prisma.attendance.upsert({
    where: {
      userId_date: { userId: input.userId, date },
    },
    create: {
      userId: input.userId,
      date,
      status: input.status,
      note: input.note,
      checkInAt,
      checkOutAt,
    },
    update: {
      status: input.status,
      note: input.note,
      ...(checkInAt !== undefined ? { checkInAt } : {}),
      ...(checkOutAt !== undefined ? { checkOutAt } : {}),
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function punchAttendanceAction(input: {
  type: "IN" | "OUT";
}) {
  const actor = await requireSession();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: actor.id, date: today } },
  });

  if (input.type === "IN") {
    await prisma.attendance.upsert({
      where: { userId_date: { userId: actor.id, date: today } },
      create: {
        userId: actor.id,
        date: today,
        status: "PRESENT",
        checkInAt: now,
      },
      update: {
        status: "PRESENT",
        checkInAt: existing?.checkInAt ?? now,
      },
    });
  } else {
    if (!existing?.checkInAt) {
      return { error: "Check in before checking out" };
    }
    await prisma.attendance.update({
      where: { userId_date: { userId: actor.id, date: today } },
      data: { checkOutAt: now, status: "PRESENT" },
    });
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markNotificationsReadAction() {
  const actor = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: actor.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/");
  return { success: true };
}

export async function createAnnouncementAction(input: {
  title: string;
  body: string;
  scope: "GLOBAL" | "SUBSIDIARY";
  subsidiaryId?: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_announcements");

  if (input.scope === "GLOBAL" && actor.role !== RoleName.SUPER_ADMIN) {
    return { error: "Only Super Admin can post global announcements" };
  }

  const subsidiaryId =
    input.scope === "SUBSIDIARY"
      ? input.subsidiaryId || actor.subsidiaryId
      : null;

  if (input.scope === "SUBSIDIARY") {
    if (!subsidiaryId || !canAccessSubsidiary(actor, subsidiaryId)) {
      return { error: "Forbidden: subsidiary scope" };
    }
  }

  await prisma.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      scope: input.scope,
      subsidiaryId,
      createdById: actor.id,
    },
  });

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
  const actor = await requireSession();
  requirePermission(actor, "manage_announcements");

  const item = await prisma.announcement.findUnique({ where: { id } });
  if (!item) return { error: "Not found" };
  if (
    item.scope === "SUBSIDIARY" &&
    !canAccessSubsidiary(actor, item.subsidiaryId)
  ) {
    return { error: "Forbidden" };
  }
  if (item.scope === "GLOBAL" && actor.role !== RoleName.SUPER_ADMIN) {
    return { error: "Only Super Admin can delete global announcements" };
  }

  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAnnouncementAction(input: {
  id: string;
  title: string;
  body: string;
}) {
  const actor = await requireSession();
  requirePermission(actor, "manage_announcements");

  const item = await prisma.announcement.findUnique({ where: { id: input.id } });
  if (!item) return { error: "Not found" };
  if (
    item.scope === "SUBSIDIARY" &&
    !canAccessSubsidiary(actor, item.subsidiaryId)
  ) {
    return { error: "Forbidden" };
  }
  if (item.scope === "GLOBAL" && actor.role !== RoleName.SUPER_ADMIN) {
    return { error: "Only Super Admin can edit global announcements" };
  }

  await prisma.announcement.update({
    where: { id: input.id },
    data: { title: input.title, body: input.body },
  });

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}
