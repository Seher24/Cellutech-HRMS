"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Body is required"),
  scope: z.enum(["GLOBAL", "SUBSIDIARY"]),
  subsidiaryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AnnouncementManager({
  isSuperAdmin,
  subsidiaries,
  defaultSubsidiaryId,
  items,
}: {
  isSuperAdmin: boolean;
  subsidiaries: { id: string; name: string }[];
  defaultSubsidiaryId: string | null;
  items: {
    id: string;
    title: string;
    body: string;
    scope: string;
    subsidiaryName: string | null;
    createdAt: string;
    author: string;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      body: "",
      scope: isSuperAdmin ? "GLOBAL" : "SUBSIDIARY",
      subsidiaryId: defaultSubsidiaryId ?? subsidiaries[0]?.id ?? "",
    },
  });

  const scope = watch("scope");

  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
        onSubmit={handleSubmit((values) => {
          startTransition(async () => {
            await createAnnouncementAction(values);
            reset();
            router.refresh();
          });
        })}
      >
        <h3 className="font-semibold">Post announcement</h3>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...register("title")} />
          {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea rows={4} {...register("body")} />
          {errors.body && <p className="text-xs text-red-600">{errors.body.message}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Scope</Label>
            <select className="h-9 w-full rounded-lg border px-3 text-sm" {...register("scope")}>
              {isSuperAdmin && <option value="GLOBAL">Global</option>}
              <option value="SUBSIDIARY">Subsidiary</option>
            </select>
          </div>
          {scope === "SUBSIDIARY" && (
            <div className="space-y-2">
              <Label>Subsidiary</Label>
              <select
                className="h-9 w-full rounded-lg border px-3 text-sm"
                {...register("subsidiaryId")}
              >
                {subsidiaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
          {pending ? "Posting..." : "Publish"}
        </Button>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500">
                  {item.scope}
                  {item.subsidiaryName ? ` / ${item.subsidiaryName}` : ""} · {item.author} ·{" "}
                  {item.createdAt}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteAnnouncementAction(item.id);
                    router.refresh();
                  });
                }}
              >
                Delete
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
