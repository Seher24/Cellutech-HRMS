import { RoleName } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? "";
          if (/[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");
}

function csvResponse(filename: string, content: string) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function assertCanExport() {
  const user = await requireSession();
  if (
    user.role !== RoleName.SUPER_ADMIN &&
    user.role !== RoleName.HR_MANAGER &&
    !hasPermission(user.role, "view_subsidiary_dashboard")
  ) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;
  const actor = await assertCanExport();

  const subsidiaryFilter =
    actor.role === RoleName.SUPER_ADMIN
      ? {}
      : { subsidiaryId: actor.subsidiaryId ?? undefined };

  if (type === "headcount") {
    const users = await prisma.user.findMany({
      where: { status: { not: "TERMINATED" }, ...subsidiaryFilter },
      include: {
        role: true,
        subsidiary: true,
        department: true,
        designation: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const rows = [
      [
        "First Name",
        "Last Name",
        "Email",
        "Role",
        "Subsidiary",
        "Department",
        "Designation",
        "Status",
        "Joining Date",
      ],
      ...users.map((u) => [
        u.firstName,
        u.lastName,
        u.email,
        u.role.name,
        u.subsidiary?.name ?? "",
        u.department?.name ?? "",
        u.designation?.title ?? "",
        u.status,
        u.joiningDate.toISOString().slice(0, 10),
      ]),
    ];

    return csvResponse("headcount-report.csv", toCsv(rows));
  }

  if (type === "leave") {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        user: subsidiaryFilter,
      },
      include: {
        user: { include: { subsidiary: true, department: true } },
        leaveType: true,
      },
      orderBy: { startDate: "desc" },
    });

    const rows = [
      [
        "Employee",
        "Email",
        "Subsidiary",
        "Department",
        "Leave Type",
        "Start",
        "End",
        "Days",
        "Status",
        "Reason",
      ],
      ...leaves.map((l) => [
        `${l.user.firstName} ${l.user.lastName}`,
        l.user.email,
        l.user.subsidiary?.name ?? "",
        l.user.department?.name ?? "",
        l.leaveType.name,
        l.startDate.toISOString().slice(0, 10),
        l.endDate.toISOString().slice(0, 10),
        String(l.totalDays),
        l.status,
        l.reason,
      ]),
    ];

    return csvResponse("leave-summary-report.csv", toCsv(rows));
  }

  if (type === "attendance") {
    const records = await prisma.attendance.findMany({
      where: {
        user: subsidiaryFilter,
      },
      include: {
        user: { include: { subsidiary: true, department: true } },
      },
      orderBy: [{ date: "desc" }, { user: { lastName: "asc" } }],
      take: 2000,
    });

    const rows = [
      ["Employee", "Email", "Subsidiary", "Department", "Date", "Status", "Note"],
      ...records.map((r) => [
        `${r.user.firstName} ${r.user.lastName}`,
        r.user.email,
        r.user.subsidiary?.name ?? "",
        r.user.department?.name ?? "",
        r.date.toISOString().slice(0, 10),
        r.status,
        r.note ?? "",
      ]),
    ];

    return csvResponse("attendance-report.csv", toCsv(rows));
  }

  return new Response("Unknown report type", { status: 404 });
}
