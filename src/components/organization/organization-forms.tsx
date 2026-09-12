"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCompanyAction,
  createCountryAction,
  createDepartmentAction,
  createDesignationAction,
  createSubsidiaryAction,
  updateSubsidiaryAction,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SubsidiaryRow = {
  id: string;
  name: string;
  city: string;
  timezone: string;
  currency: string;
  isActive: boolean;
};

export function OrganizationForms({
  isSuperAdmin,
  companies,
  countries,
  subsidiaries,
  subsidiaryDetails,
  departments,
  defaultSubsidiaryId,
}: {
  isSuperAdmin: boolean;
  companies: { id: string; name: string }[];
  countries: { id: string; name: string }[];
  subsidiaries: { id: string; name: string }[];
  subsidiaryDetails: SubsidiaryRow[];
  departments: { id: string; name: string }[];
  defaultSubsidiaryId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {isSuperAdmin && (
          <>
            <form
              className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  await createCompanyAction({
                    name: String(fd.get("name")),
                    legalName: String(fd.get("legalName") || "") || undefined,
                  });
                  router.refresh();
                });
              }}
            >
              <h4 className="font-semibold">Add company</h4>
              <Input name="name" placeholder="Company name" required />
              <Input name="legalName" placeholder="Legal name (optional)" />
              <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
                Create company
              </Button>
            </form>

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
                    companyId: String(fd.get("companyId")),
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
              <select name="companyId" required className="h-9 w-full rounded-lg border px-3 text-sm">
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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

      {isSuperAdmin && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h4 className="mb-3 font-semibold">Edit / deactivate subsidiaries</h4>
          <div className="space-y-3">
            {subsidiaryDetails.map((s) =>
              editingId === s.id ? (
                <form
                  key={s.id}
                  className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    startTransition(async () => {
                      await updateSubsidiaryAction({
                        id: s.id,
                        name: String(fd.get("name")),
                        city: String(fd.get("city")),
                        timezone: String(fd.get("timezone")),
                        currency: String(fd.get("currency")),
                        isActive: fd.get("isActive") === "true",
                      });
                      setEditingId(null);
                      router.refresh();
                    });
                  }}
                >
                  <Input name="name" defaultValue={s.name} required />
                  <Input name="city" defaultValue={s.city} required />
                  <Input name="timezone" defaultValue={s.timezone} required />
                  <Input name="currency" defaultValue={s.currency} required />
                  <select
                    name="isActive"
                    defaultValue={s.isActive ? "true" : "false"}
                    className="h-9 rounded-lg border px-3 text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {s.name}{" "}
                      <span className="text-xs text-slate-500">
                        ({s.isActive ? "Active" : "Inactive"})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.city} · {s.currency} · {s.timezone}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(s.id)}>
                    Edit
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
