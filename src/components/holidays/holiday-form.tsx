"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHolidayAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HolidayForm({
  subsidiaryId,
  subsidiaries,
  lockSubsidiary,
}: {
  subsidiaryId: string;
  subsidiaries: { id: string; name: string }[];
  lockSubsidiary: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="max-w-lg space-y-3 rounded-xl border bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await createHolidayAction({
            subsidiaryId: String(fd.get("subsidiaryId")),
            name: String(fd.get("name")),
            date: String(fd.get("date")),
          });
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
        {pending ? "Saving…" : "Add holiday"}
      </Button>
    </form>
  );
}
