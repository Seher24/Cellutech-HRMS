"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createHolidayAction,
  deleteHolidayAction,
  updateHolidayAction,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HolidayRow = {
  id: string;
  name: string;
  date: string;
};

export function HolidayManager({
  subsidiaryId,
  subsidiaries,
  lockSubsidiary,
  holidays,
}: {
  subsidiaryId: string;
  subsidiaries: { id: string; name: string }[];
  lockSubsidiary: boolean;
  holidays: HolidayRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Holiday</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No holidays configured.
                </td>
              </tr>
            )}
            {holidays.map((h) =>
              editingId === h.id ? (
                <tr key={h.id} className="border-b border-slate-100">
                  <td className="px-4 py-3" colSpan={3}>
                    <form
                      className="flex flex-col gap-2 sm:flex-row sm:items-end"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setError(null);
                        startTransition(async () => {
                          const result = await updateHolidayAction({
                            id: h.id,
                            name: String(fd.get("name")),
                            date: String(fd.get("date")),
                          });
                          if (result?.error) {
                            setError(result.error);
                            return;
                          }
                          setEditingId(null);
                          router.refresh();
                        });
                      }}
                    >
                      <Input name="name" defaultValue={h.name} required className="sm:flex-1" />
                      <Input name="date" type="date" defaultValue={h.date} required />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={pending}
                          className="bg-teal-700 hover:bg-teal-800"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={h.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{h.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(h.id)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          startTransition(async () => {
                            const result = await deleteHolidayAction(h.id);
                            if (result?.error) {
                              setError(result.error);
                              return;
                            }
                            router.refresh();
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <form
        className="max-w-lg space-y-3 rounded-xl border bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createHolidayAction({
              subsidiaryId: String(fd.get("subsidiaryId")),
              name: String(fd.get("name")),
              date: String(fd.get("date")),
            });
            if (result?.error) {
              setError(result.error);
              return;
            }
            e.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <h3 className="font-semibold">Add holiday</h3>
        {!lockSubsidiary && (
          <div className="space-y-2">
            <Label>Subsidiary</Label>
            <select
              name="subsidiaryId"
              defaultValue={subsidiaryId}
              className="h-9 w-full rounded-lg border px-3 text-sm"
            >
              {subsidiaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {lockSubsidiary && <input type="hidden" name="subsidiaryId" value={subsidiaryId} />}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input name="date" type="date" required />
        </div>
        <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
          {pending ? "Saving..." : "Add holiday"}
        </Button>
      </form>
    </div>
  );
}
