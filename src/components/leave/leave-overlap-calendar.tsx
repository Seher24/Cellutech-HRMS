"use client";

import { ResponsiveTable } from "@/components/ui/responsive-table";

type Item = {
  id: string;
  employee: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  overlapsWith: string[];
};

export function LeaveOverlapCalendar({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No approved leave in this view.
      </div>
    );
  }

  const minDate = items.reduce(
    (min, item) => (item.startDate < min ? item.startDate : min),
    items[0].startDate
  );
  const maxDate = items.reduce(
    (max, item) => (item.endDate > max ? item.endDate : max),
    items[0].endDate
  );

  const start = new Date(minDate);
  const end = new Date(maxDate);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 [-webkit-overflow-scrolling:touch]">
        <div className="mb-3 text-xs text-slate-500">
          Timeline from {minDate} to {maxDate}. Red-tint rows have overlapping leave.
        </div>
        <div className="min-w-[560px] space-y-2 sm:min-w-[720px]">
          {items.map((item) => {
            const hasOverlap = item.overlapsWith.length > 0;
            return (
              <div
                key={item.id}
                className="grid grid-cols-[120px_1fr] items-center gap-2 sm:grid-cols-[180px_1fr] sm:gap-3"
              >
                <div className="min-w-0 text-xs">
                  <p className="truncate font-medium text-slate-900">{item.employee}</p>
                  <p className="truncate text-slate-500">
                    {item.leaveType} · {item.totalDays}d
                  </p>
                </div>
                <div
                  className={`relative h-8 rounded-md border ${
                    hasOverlap
                      ? "border-rose-200 bg-rose-50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="absolute inset-0 flex">
                    {days.map((day) => {
                      const active = day >= item.startDate && day <= item.endDate;
                      return (
                        <div
                          key={day}
                          className={`flex-1 border-r border-white/40 ${
                            active
                              ? hasOverlap
                                ? "bg-rose-500/80"
                                : "bg-teal-600/80"
                              : ""
                          }`}
                          title={day}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ResponsiveTable>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Overlaps with</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">
                  {item.employee}
                  <div className="text-xs font-normal text-slate-500">
                    {item.department}
                  </div>
                </td>
                <td className="px-4 py-3">{item.leaveType}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.startDate} - {item.endDate}
                </td>
                <td className="px-4 py-3">{item.totalDays}</td>
                <td className="max-w-xs px-4 py-3 break-words">
                  {item.overlapsWith.length === 0 ? (
                    <span className="text-slate-400">None</span>
                  ) : (
                    <span className="text-rose-700">
                      {item.overlapsWith.join(", ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>
    </div>
  );
}
