import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const REPORTS = [
  {
    type: "headcount",
    title: "Headcount report",
    description: "Active employees with role, subsidiary, and department.",
  },
  {
    type: "leave",
    title: "Leave summary",
    description: "Leave requests with dates, type, status, and reason.",
  },
  {
    type: "attendance",
    title: "Attendance report",
    description: "Attendance status records filterable by your access scope.",
  },
] as const;

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    session.user.role !== RoleName.SUPER_ADMIN &&
    session.user.role !== RoleName.HR_MANAGER &&
    session.user.role !== RoleName.DEPARTMENT_HEAD
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reports and exports</h2>
        <p className="text-sm text-slate-500">
          Download CSV reports scoped to your role (global for Super Admin, subsidiary for HR).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((report) => (
          <div
            key={report.type}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{report.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{report.description}</p>
            <a href={`/api/reports/${report.type}`} className="mt-4 inline-block">
              <Button className="bg-teal-700 hover:bg-teal-800">
                <FileDown className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
