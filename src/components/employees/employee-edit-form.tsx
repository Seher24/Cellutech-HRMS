"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reactivateEmployeeAction,
  updateEmployeeAction,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  roleName: z.enum([
    "SUPER_ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_HEAD",
    "TEAM_LEAD",
    "EMPLOYEE",
    "FINANCE",
  ]),
  subsidiaryId: z.string().min(1),
  departmentId: z.string().min(1),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  joiningDate: z.string().min(1),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeEditForm({
  employee,
  subsidiaries,
  departments,
  designations,
  managers,
  roles,
}: {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleName: FormValues["roleName"];
    subsidiaryId: string;
    departmentId: string;
    designationId: string;
    managerId: string;
    joiningDate: string;
    status: FormValues["status"];
  };
  subsidiaries: { id: string; name: string }[];
  departments: { id: string; name: string; subsidiaryId: string }[];
  designations: { id: string; title: string; departmentId: string }[];
  managers: { id: string; name: string }[];
  roles: { name: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...employee,
      phone: employee.phone || "",
      designationId: employee.designationId || "",
      managerId: employee.managerId || "",
    },
  });

  const subsidiaryId = watch("subsidiaryId");
  const departmentId = watch("departmentId");

  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.subsidiaryId === subsidiaryId),
    [departments, subsidiaryId]
  );
  const filteredDesignations = useMemo(
    () => designations.filter((d) => d.departmentId === departmentId),
    [designations, departmentId]
  );

  function onSubmit(values: FormValues) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateEmployeeAction({
        id: employee.id,
        ...values,
        phone: values.phone || undefined,
        designationId: values.designationId || undefined,
        managerId: values.managerId || undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Employee record updated");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">Edit employee</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>First name</Label>
          <Input {...register("firstName")} />
          {errors.firstName && (
            <p className="text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Last name</Label>
          <Input {...register("lastName")} />
          {errors.lastName && (
            <p className="text-xs text-red-600">{errors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("roleName")}>
            {roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Joining date</Label>
          <Input type="date" {...register("joiningDate")} />
        </div>
        <div className="space-y-2">
          <Label>Subsidiary</Label>
          <select
            className="h-9 w-full rounded-lg border px-3 text-sm"
            {...register("subsidiaryId", {
              onChange: () => setValue("departmentId", ""),
            })}
          >
            {subsidiaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("departmentId")}>
            <option value="">Select department</option>
            {filteredDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("designationId")}>
            <option value="">Optional</option>
            {filteredDesignations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Manager</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("managerId")}>
            <option value="">Optional</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
          {pending ? "Saving..." : "Save employee"}
        </Button>
        {employee.status === "TERMINATED" && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await reactivateEmployeeAction(employee.id);
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                setMessage("Employee reactivated");
                router.refresh();
              });
            }}
          >
            Reactivate
          </Button>
        )}
      </div>
    </form>
  );
}
