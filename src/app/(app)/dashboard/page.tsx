import { RoleName } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { user } = session;
  const year = new Date().getFullYear();

  if (user.role === RoleName.SUPER_ADMIN) {
    const [totalHeadcount, bySubsidiary, pendingLeaves, announcements, countryCount] =
      await Promise.all([
        prisma.user.count({ where: { status: { not: "TERMINATED" } } }),
        prisma.subsidiary.findMany({
          include: {
            country: true,
            _count: { select: { users: true } },
          },
        }),
        prisma.leaveRequest.count({
          where: { status: { in: ["PENDING", "PENDING_L2"] } },
        }),
        prisma.announcement.findMany({
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.country.count(),
      ]);

    const chartData = bySubsidiary.map((s) => ({
      name: s.city,
      headcount: s._count.users,
    }));

    return (
      <DashboardShell
        title="Global Overview"
        subtitle="Workforce across all subsidiaries"
        metrics={[
          { label: "Total headcount", value: String(totalHeadcount) },
          { label: "Subsidiaries", value: String(bySubsidiary.length) },
          { label: "Pending leave", value: String(pendingLeaves) },
          { label: "Countries", value: String(countryCount) },
        ]}
        chartTitle="Headcount by subsidiary"
        chartData={chartData}
        announcements={announcements}
      />
    );
  }

  if (user.role === RoleName.HR_MANAGER || user.role === RoleName.DEPARTMENT_HEAD) {
    const subsidiaryId = user.subsidiaryId!;
    const deptFilter =
      user.role === RoleName.DEPARTMENT_HEAD && user.departmentId
        ? { departmentId: user.departmentId }
        : {};

    const [headcount, byDept, pendingLeaves, holidays, attendanceToday] =
      await Promise.all([
        prisma.user.count({
          where: {
            subsidiaryId,
            status: { not: "TERMINATED" },
            ...deptFilter,
          },
        }),
        prisma.department.findMany({
          where: {
            subsidiaryId,
            ...(user.role === RoleName.DEPARTMENT_HEAD && user.departmentId
              ? { id: user.departmentId }
              : {}),
          },
          include: { _count: { select: { users: true } } },
        }),
        prisma.leaveRequest.count({
          where: {
            status: { in: ["PENDING", "PENDING_L2"] },
            user: { subsidiaryId, ...deptFilter },
          },
        }),
        prisma.holiday.findMany({
          where: {
            subsidiaryId,
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 3,
        }),
        prisma.attendance.count({
          where: {
            status: "PRESENT",
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            user: { subsidiaryId, ...deptFilter },
          },
        }),
      ]);

    return (
      <DashboardShell
        title={
          user.role === RoleName.HR_MANAGER
            ? "Subsidiary Overview"
            : "Department Overview"
        }
        subtitle="Live metrics for your scope"
        metrics={[
          { label: "Headcount", value: String(headcount) },
          { label: "Pending leave", value: String(pendingLeaves) },
          { label: "Present today", value: String(attendanceToday) },
          { label: "Upcoming holidays", value: String(holidays.length) },
        ]}
        chartTitle="Headcount by department"
        chartData={byDept.map((d) => ({
          name: d.name,
          headcount: d._count.users,
        }))}
        sideNotes={holidays.map(
          (h) => `${h.name} - ${h.date.toLocaleDateString()}`
        )}
      />
    );
  }

  if (user.role === RoleName.TEAM_LEAD) {
    const reports = await prisma.user.findMany({
      where: { managerId: user.id, status: { not: "TERMINATED" } },
      select: { id: true },
    });
    const reportIds = reports.map((r) => r.id);
    const [pending, onLeaveSoon, present] = await Promise.all([
      prisma.leaveRequest.count({
        where: {
          status: { in: ["PENDING", "PENDING_L2"] },
          approvalSteps: {
            some: { approverId: user.id, decision: "PENDING" },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          userId: { in: reportIds },
          status: "APPROVED",
          startDate: { gte: new Date() },
        },
      }),
      prisma.attendance.count({
        where: {
          userId: { in: reportIds },
          status: "PRESENT",
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return (
      <DashboardShell
        title="Team Dashboard"
        subtitle="Your direct reports at a glance"
        metrics={[
          { label: "Direct reports", value: String(reportIds.length) },
          { label: "Pending approvals", value: String(pending) },
          { label: "Upcoming leave", value: String(onLeaveSoon) },
          { label: "Present today", value: String(present) },
        ]}
        chartTitle="Team size"
        chartData={[
          { name: "Reports", headcount: reportIds.length },
          { name: "Pending", headcount: pending },
        ]}
      />
    );
  }

  if (user.role === RoleName.FINANCE) {
    const subsidiaryId = user.subsidiaryId!;
    const [approvedLeave, attendanceRows, headcount] = await Promise.all([
      prisma.leaveRequest.count({
        where: { status: "APPROVED", user: { subsidiaryId } },
      }),
      prisma.attendance.count({
        where: { user: { subsidiaryId } },
      }),
      prisma.user.count({
        where: { subsidiaryId, status: { not: "TERMINATED" } },
      }),
    ]);

    return (
      <DashboardShell
        title="Finance / Payroll Overview"
        subtitle="View-only leave and attendance inputs for payroll"
        metrics={[
          { label: "Subsidiary headcount", value: String(headcount) },
          { label: "Approved leave records", value: String(approvedLeave) },
          { label: "Attendance rows", value: String(attendanceRows) },
          { label: "Export access", value: "CSV + PDF" },
        ]}
        chartTitle="Payroll data volume"
        chartData={[
          { name: "Headcount", headcount },
          { name: "Leave", headcount: approvedLeave },
          { name: "Attendance", headcount: attendanceRows },
        ]}
      />
    );
  }

  // Employee dashboard
  const [balances, myRequests, holidays, announcements] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { userId: user.id, year },
      include: { leaveType: true },
    }),
    prisma.leaveRequest.findMany({
      where: { userId: user.id },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.holiday.findMany({
      where: {
        subsidiaryId: user.subsidiaryId ?? undefined,
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { scope: "GLOBAL" },
          { subsidiaryId: user.subsidiaryId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          My Dashboard
        </h2>
        <p className="text-sm text-slate-500">
          Leave balances, requests, and announcements
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balances.slice(0, 4).map((b) => (
          <Card key={b.id} className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {b.leaveType.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">
                {b.allotted - b.used}
                <span className="text-sm font-normal text-slate-400">
                  {" "}
                  / {b.allotted}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent leave requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRequests.length === 0 && (
              <p className="text-sm text-slate-500">No requests yet.</p>
            )}
            {myRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{r.leaveType.name}</p>
                  <p className="text-xs text-slate-500">
                    {r.startDate.toLocaleDateString()} -{" "}
                    {r.endDate.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Upcoming holidays</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className="flex justify-between text-sm">
                <span>{h.name}</span>
                <span className="text-slate-500">
                  {h.date.toLocaleDateString()}
                </span>
              </div>
            ))}
            {announcements.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Announcements
                </p>
                {announcements.map((a) => (
                  <div key={a.id} className="mb-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <DashboardCharts
        title="Leave utilization"
        data={balances.map((b) => ({
          name: b.leaveType.code,
          headcount: b.used,
        }))}
      />
    </div>
  );
}

function DashboardShell({
  title,
  subtitle,
  metrics,
  chartTitle,
  chartData,
  announcements,
  sideNotes,
}: {
  title: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  chartTitle: string;
  chartData: { name: string; headcount: number }[];
  announcements?: { id: string; title: string; body: string }[];
  sideNotes?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {m.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {m.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts title={chartTitle} data={chartData} />
        </div>
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {sideNotes?.map((n) => (
              <p key={n}>{n}</p>
            ))}
            {announcements?.map((a) => (
              <div key={a.id}>
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500 line-clamp-3">{a.body}</p>
              </div>
            ))}
            {!sideNotes?.length && !announcements?.length && (
              <p>All systems operational. Review pending leave in Approvals.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
