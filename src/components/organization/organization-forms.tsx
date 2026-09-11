"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCountryAction,
  createDepartmentAction,
  createDesignationAction,
  createSubsidiaryAction,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizationForms({
  isSuperAdmin,
  countries,
  subsidiaries,
  departments,
  defaultSubsidiaryId,
}: {
  isSuperAdmin: boolean;
  countries: { id: string; name: string }[];
  subsidiaries: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  defaultSubsidiaryId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {isSuperAdmin && (
        <>
          <form
            className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                await createCountryAction({
                  name: String(fd.get("name")),
                  code: String(fd.get("code")),
                });
                router.refresh();
              });
            }}
          >
            <h4 className="font-semibold">Add country</h4>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input name="code" required maxLength={3} placeholder="PK" />
            </div>
            <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
              Create country
            </Button>
          </form>

          <form
            className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                await createSubsidiaryAction({
                  name: String(fd.get("name")),
                  city: String(fd.get("city")),
                  countryId: String(fd.get("countryId")),
                  timezone: String(fd.get("timezone")),
                  currency: String(fd.get("currency")),
                });
                router.refresh();
              });
            }}
          >
            <h4 className="font-semibold">Add subsidiary</h4>
            <Input name="name" placeholder="Name" required />
            <Input name="city" placeholder="City" required />
            <select name="countryId" required className="h-9 w-full rounded-lg border px-3 text-sm">
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Input name="timezone" defaultValue="Asia/Karachi" required />
            <Input name="currency" defaultValue="PKR" required />
            <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
              Create subsidiary
            </Button>
          </form>
        </>
      )}

      <form
        className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await createDepartmentAction({
              name: String(fd.get("name")),
              subsidiaryId: String(fd.get("subsidiaryId")),
            });
            router.refresh();
          });
        }}
      >
        <h4 className="font-semibold">Add department</h4>
        <Input name="name" placeholder="Department name" required />
        <select
          name="subsidiaryId"
          required
          defaultValue={defaultSubsidiaryId ?? subsidiaries[0]?.id}
          className="h-9 w-full rounded-lg border px-3 text-sm"
        >
          {subsidiaries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
          Create department
        </Button>
      </form>

      <form
        className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await createDesignationAction({
              title: String(fd.get("title")),
              departmentId: String(fd.get("departmentId")),
            });
            router.refresh();
          });
        }}
      >
        <h4 className="font-semibold">Add designation</h4>
        <Input name="title" placeholder="Job title" required />
        <select name="departmentId" required className="h-9 w-full rounded-lg border px-3 text-sm">
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
          Create designation
        </Button>
      </form>
    </div>
  );
}
