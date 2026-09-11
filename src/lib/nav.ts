import {
  LayoutDashboard,
  Users,
  Network,
  CalendarDays,
  ClipboardCheck,
  Building2,
  Plane,
  Calendar,
  Bell,
  UserRound,
  FileDown,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { RoleName } from "@prisma/client";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export function getNavForRole(role: RoleName): NavItem[] {
  const base: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Profile", href: "/employees/me", icon: UserRound },
    { title: "Employees", href: "/employees", icon: Users },
    { title: "Org Chart", href: "/org-chart", icon: Network },
    { title: "Request Leave", href: "/leave/request", icon: Plane },
    { title: "My Leave", href: "/leave/my-requests", icon: CalendarDays },
  ];

  if (
    role === RoleName.SUPER_ADMIN ||
    role === RoleName.HR_MANAGER ||
    role === RoleName.DEPARTMENT_HEAD ||
    role === RoleName.TEAM_LEAD
  ) {
    base.push({ title: "Approvals", href: "/leave/approvals", icon: ClipboardCheck });
  }

  base.push({ title: "Leave Calendar", href: "/leave/calendar", icon: CalendarDays });

  if (role === RoleName.SUPER_ADMIN || role === RoleName.HR_MANAGER) {
    base.push({ title: "Organization", href: "/organization", icon: Building2 });
    base.push({ title: "Announcements", href: "/announcements", icon: Megaphone });
  }

  if (
    role === RoleName.SUPER_ADMIN ||
    role === RoleName.HR_MANAGER ||
    role === RoleName.DEPARTMENT_HEAD
  ) {
    base.push({ title: "Reports", href: "/reports", icon: FileDown });
  }

  base.push(
    { title: "Holidays", href: "/holidays", icon: Calendar },
    { title: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { title: "Notifications", href: "/notifications", icon: Bell }
  );

  return base;
}
