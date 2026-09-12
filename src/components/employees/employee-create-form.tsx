"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeAction } from "@/lib/actions/hr";
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
  subsidiaryId: z.string().min(1, "Required"),
  departmentId: z.string().min(1, "Required"),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  joiningDate: z.string().min(1, "Required"),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  subsidiaries: { id: string; name: string }[];
  departments: { id: string; name: string; subsidiaryId: string }[];
  designations: { id: string; title: string; departmentId: string }[];
  managers: { id: string; name: string }[];
  roles: { name: string; label: string }[];
};

export function EmployeeCreateForm(props: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleName: "EMPLOYEE",
      subsidiaryId: props.subsidiaries[0]?.id ?? "",
      departmentId: "",
      designationId: "",
      managerId: "",
      joiningDate: "",
      password: "",
    },
  });

  const subsidiaryId = watch("subsidiaryId");
  const departmentId = watch("departmentId");

  const departments = useMemo(
    () => props.departments.filter((d) => d.subsidiaryId === subsidiaryId),
    [props.departments, subsidiaryId]
  );
  const designations = useMemo(
    () => props.designations.filter((d) => d.departmentId === departmentId),
    [props.designations, departmentId]
  );

  function onSubmit(values: FormValues) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createEmployeeAction({
        ...values,
        phone: values.phone || undefined,
        designationId: values.designationId || undefined,
        managerId: values.managerId || undefined,
        password: values.password || undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage(`Employee created. Temporary password: ${result.temporaryPassword}`);
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roleName: "EMPLOYEE",
        subsidiaryId: props.subsidiaries[0]?.id ?? "",
        departmentId: "",
        designationId: "",
        managerId: "",
        joiningDate: "",
        password: "",
      });
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">Onboard employee</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>First name</Label>
          <Input {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Last name</Label>
          <Input {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
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
            {props.roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Joining date</Label>
          <Input type="date" {...register("joiningDate")} />
          {errors.joiningDate && <p className="text-xs text-red-600">{errors.joiningDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Subsidiary</Label>
          <select
            className="h-9 w-full rounded-lg border px-3 text-sm"
            {...register("subsidiaryId", {
              onChange: () => setValue("departmentId", ""),
            })}
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
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("departmentId")}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.departmentId && (
            <p className="text-xs text-red-600">{errors.departmentId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("designationId")}>
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
          <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("managerId")}>
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
          <Input {...register("password")} placeholder="Defaults to Password123!" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-700">{message}</p>}
      <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
        {pending ? "Creating..." : "Create employee"}
      </Button>
    </form>
  );
}
