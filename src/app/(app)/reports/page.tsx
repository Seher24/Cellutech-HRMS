import { RoleName } from "@prisma/client";
import { redirect } from "next/navigation";
import { FileDown, FileText } from "lucide-react";
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
    description: "Attendance status and check-in/out timestamps in your scope.",
  },
] as const;

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    session.user.role !== RoleName.SUPER_ADMIN &&
    session.user.role !== RoleName.HR_MANAGER &&
    session.user.role !== RoleName.DEPARTMENT_HEAD &&
    session.user.role !== RoleName.FINANCE
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Reports and exports
        </h2>
        <p className="text-sm text-slate-500">
          Download CSV or PDF reports scoped to your role.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <div
            key={report.type}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <h3 className="font-semibold text-slate-900">{report.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{report.description}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a href={`/api/reports/${report.type}`} className="w-full sm:w-auto">
                <Button className="w-full bg-teal-700 hover:bg-teal-800 sm:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </a>
              <a href={`/api/reports/${report.type}/pdf`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
