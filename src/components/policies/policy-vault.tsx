"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePolicyDocumentAction, uploadPolicyDocumentAction } from "@/lib/actions/policies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PolicyVault({
  canManage,
  isSuperAdmin,
  subsidiaries,
  defaultSubsidiaryId,
  items,
}: {
  canManage: boolean;
  isSuperAdmin: boolean;
  subsidiaries: { id: string; name: string }[];
  defaultSubsidiaryId: string | null;
  items: {
    id: string;
    title: string;
    category: string;
    description: string | null;
    fileName: string;
    scope: string;
    subsidiaryName: string | null;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
            No policy documents yet.
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-slate-500">
                  {item.category} · {item.scope}
                  {item.subsidiaryName ? ` / ${item.subsidiaryName}` : ""} · {item.fileName} ·{" "}
                  {item.createdAt}
                </p>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={`/api/policies/${item.id}`}>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </a>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await deletePolicyDocumentAction(item.id);
                        router.refresh();
                      });
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <form
          className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!file) {
              setError("Choose a file");
              return;
            }
            const fd = new FormData(e.currentTarget);
            fd.set("file", file);
            setError(null);
            startTransition(async () => {
              const result = await uploadPolicyDocumentAction(fd);
              if (result?.error) {
                setError(result.error);
                return;
              }
              setFile(null);
              e.currentTarget.reset();
              router.refresh();
            });
          }}
        >
          <h3 className="font-semibold">Upload policy / HR document</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select name="category" className="h-9 w-full rounded-lg border px-3 text-sm">
                <option>Policy</option>
                <option>Handbook</option>
                <option>Offer template</option>
                <option>Compliance</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <select name="scope" className="h-9 w-full rounded-lg border px-3 text-sm">
                {isSuperAdmin && <option value="GLOBAL">Global</option>}
                <option value="SUBSIDIARY">Subsidiary</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subsidiary</Label>
              <select
                name="subsidiaryId"
                defaultValue={defaultSubsidiaryId ?? subsidiaries[0]?.id}
                className="h-9 w-full rounded-lg border px-3 text-sm"
              >
                {subsidiaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
            {pending ? "Uploading..." : "Upload to vault"}
          </Button>
        </form>
      )}
    </div>
  );
}
