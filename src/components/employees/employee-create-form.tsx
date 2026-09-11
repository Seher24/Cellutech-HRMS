"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  subsidiaries: { id: string; name: string }[];
  departments: { id: string; name: string; subsidiaryId: string }[];
  designations: { id: string; title: string; departmentId: string }[];
  managers: { id: string; name: string }[];
  roles: { name: string; label: string }[];
};

export function EmployeeCreateForm(props: Props) {
  const router = useRouter();
  const [subsidiaryId, setSubsidiaryId] = useState(props.subsidiaries[0]?.id ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const departments = useMemo(
    () => props.departments.filter((d) => d.subsidiaryId === subsidiaryId),
    [props.departments, subsidiaryId]
  );
  const designations = useMemo(
    () => props.designations.filter((d) => d.departmentId === departmentId),
    [props.designations, departmentId]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createEmployeeAction({
        firstName: String(fd.get("firstName")),
        lastName: String(fd.get("lastName")),
        email: String(fd.get("email")),
        phone: String(fd.get("phone") || "") || undefined,
        roleName: String(fd.get("roleName")) as never,
        subsidiaryId: String(fd.get("subsidiaryId")),
        departmentId: String(fd.get("departmentId")),
        designationId: String(fd.get("designationId") || "") || undefined,
        managerId: String(fd.get("managerId") || "") || undefined,
        joiningDate: String(fd.get("joiningDate")),
        password: String(fd.get("password") || "") || undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage(
        `Employee created. Temporary password: ${result.temporaryPassword}`
      );
      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">Onboard employee</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>First name</Label>
          <Input name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label>Last name</Label>
          <Input name="lastName" required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input name="phone" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select name="roleName" required className="h-9 w-full rounded-lg border px-3 text-sm">
            {props.roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Joining date</Label>
          <Input name="joiningDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label>Subsidiary</Label>
          <select
            name="subsidiaryId"
            required
            value={subsidiaryId}
            onChange={(e) => {
              setSubsidiaryId(e.target.value);
              setDepartmentId("");
            }}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          >
            {props.subsidiaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <select
            name="departmentId"
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <select name="designationId" className="h-9 w-full rounded-lg border px-3 text-sm">
            <option value="">Optional</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Manager</Label>
          <select name="managerId" className="h-9 w-full rounded-lg border px-3 text-sm">
            <option value="">Optional</option>
            {props.managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Temporary password (optional)</Label>
          <Input name="password" placeholder="Defaults to Password123!" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Creating…" : "Create employee"}
      </Button>
    </form>
  );
}
