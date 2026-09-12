import { RoleName } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

async function assertCanExport() {
  const user = await requireSession();
  if (
    user.role !== RoleName.SUPER_ADMIN &&
    user.role !== RoleName.HR_MANAGER &&
    user.role !== RoleName.DEPARTMENT_HEAD &&
    user.role !== RoleName.FINANCE &&
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

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Cellutech HRMS Report", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  if (type === "headcount") {
    const users = await prisma.user.findMany({
      where: { status: { not: "TERMINATED" }, ...subsidiaryFilter },
      include: {
        role: true,
        subsidiary: true,
        department: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    doc.text("Headcount Report", 14, 30);
    autoTable(doc, {
      startY: 34,
      head: [["Name", "Email", "Role", "Subsidiary", "Department", "Status"]],
      body: users.map((u) => [
        `${u.firstName} ${u.lastName}`,
        u.email,
        u.role.name,
        u.subsidiary?.name ?? "",
        u.department?.name ?? "",
        u.status,
      ]),
    });
  } else if (type === "leave") {
    const leaves = await prisma.leaveRequest.findMany({
      where: { user: subsidiaryFilter },
      include: {
        user: { include: { subsidiary: true, department: true } },
        leaveType: true,
      },
      orderBy: { startDate: "desc" },
    });

    doc.text("Leave Summary Report", 14, 30);
    autoTable(doc, {
      startY: 34,
      head: [["Employee", "Type", "Start", "End", "Days", "Status"]],
      body: leaves.map((l) => [
        `${l.user.firstName} ${l.user.lastName}`,
        l.leaveType.name,
        l.startDate.toISOString().slice(0, 10),
        l.endDate.toISOString().slice(0, 10),
        String(l.totalDays),
        l.status,
      ]),
    });
  } else if (type === "attendance") {
    const records = await prisma.attendance.findMany({
      where: { user: subsidiaryFilter },
      include: { user: { include: { subsidiary: true } } },
      orderBy: [{ date: "desc" }],
      take: 500,
    });

    doc.text("Attendance Report", 14, 30);
    autoTable(doc, {
      startY: 34,
      head: [["Employee", "Date", "Status", "Check in", "Check out"]],
      body: records.map((r) => [
        `${r.user.firstName} ${r.user.lastName}`,
        r.date.toISOString().slice(0, 10),
        r.status,
        r.checkInAt ? r.checkInAt.toISOString() : "",
        r.checkOutAt ? r.checkOutAt.toISOString() : "",
      ]),
    });
  } else {
    return new Response("Unknown report type", { status: 404 });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
    },
  });
}
