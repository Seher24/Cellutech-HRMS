import { RoleName } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  subsidiaryId: string | null;
  departmentId: string | null;
};

export type AppPermission =
  | "manage_countries"
  | "manage_subsidiaries"
  | "manage_departments"
  | "manage_employees"
  | "approve_l1_leave"
  | "approve_l2_leave"
  | "hr_override_leave"
  | "view_global_dashboard"
  | "view_subsidiary_dashboard"
  | "view_team_dashboard"
  | "view_org_chart"
  | "manage_holidays"
  | "view_attendance"
  | "manage_announcements"
  | "apply_leave"
  | "edit_own_profile";

const ROLE_PERMISSIONS: Record<RoleName, AppPermission[]> = {
  SUPER_ADMIN: [
    "manage_countries",
    "manage_subsidiaries",
    "manage_departments",
    "manage_employees",
    "approve_l2_leave",
    "hr_override_leave",
    "view_global_dashboard",
    "view_subsidiary_dashboard",
    "view_team_dashboard",
    "view_org_chart",
    "manage_holidays",
    "view_attendance",
    "manage_announcements",
    "apply_leave",
    "edit_own_profile",
  ],
  HR_MANAGER: [
    "manage_departments",
    "manage_employees",
    "approve_l2_leave",
    "hr_override_leave",
    "view_subsidiary_dashboard",
    "view_team_dashboard",
    "view_org_chart",
    "manage_holidays",
    "view_attendance",
    "manage_announcements",
    "apply_leave",
    "edit_own_profile",
  ],
  DEPARTMENT_HEAD: [
    "approve_l1_leave",
    "approve_l2_leave",
    "view_subsidiary_dashboard",
    "view_team_dashboard",
    "view_org_chart",
    "view_attendance",
    "apply_leave",
    "edit_own_profile",
  ],
  TEAM_LEAD: [
    "approve_l1_leave",
    "view_team_dashboard",
    "view_org_chart",
    "view_attendance",
    "apply_leave",
    "edit_own_profile",
  ],
  EMPLOYEE: ["view_org_chart", "apply_leave", "edit_own_profile"],
  FINANCE: [
    "view_subsidiary_dashboard",
    "view_attendance",
    "view_org_chart",
    "edit_own_profile",
  ],
};

export function hasPermission(role: RoleName, permission: AppPermission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(user: SessionUser, permission: AppPermission) {
  if (!hasPermission(user.role, permission)) {
    throw new Error("Forbidden: insufficient permissions");
  }
}

export function canAccessSubsidiary(user: SessionUser, subsidiaryId: string | null | undefined) {
  if (user.role === RoleName.SUPER_ADMIN) return true;
  if (!subsidiaryId) return false;
  return user.subsidiaryId === subsidiaryId;
}

export function displayRole(role: RoleName) {
  switch (role) {
    case RoleName.SUPER_ADMIN:
      return "Super Admin";
    case RoleName.HR_MANAGER:
      return "HR Manager";
    case RoleName.DEPARTMENT_HEAD:
      return "Department Head";
    case RoleName.TEAM_LEAD:
      return "Team Lead";
    case RoleName.EMPLOYEE:
      return "Employee";
    case RoleName.FINANCE:
      return "Finance / Payroll";
    default:
      return role;
  }
}
