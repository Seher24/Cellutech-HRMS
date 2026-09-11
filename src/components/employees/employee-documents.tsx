"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteEmployeeDocumentAction,
  uploadEmployeeDocumentAction,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeDocumentsPanel({
  userId,
  canUpload,
  documents,
}: {
  userId: string;
  canUpload: boolean;
  documents: {
    id: string;
    title: string;
    category: string;
    fileName: string;
    sizeBytes: number;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "Contract" },
  });

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-slate-900">Documents</h3>
      <div className="space-y-2">
        {documents.length === 0 && (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        )}
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{doc.title}</p>
              <p className="text-xs text-slate-500">
                {doc.category} · {doc.fileName} · {(doc.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                {doc.createdAt}
              </p>
            </div>
            <div className="flex gap-2">
              <a href={`/api/documents/${doc.id}`}>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </a>
              {canUpload && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await deleteEmployeeDocumentAction(doc.id);
                      router.refresh();
                    });
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canUpload && (
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={handleSubmit((values) => {
            if (!file) {
              setError("Choose a file");
              return;
            }
            setError(null);
            const fd = new FormData();
            fd.set("userId", userId);
            fd.set("title", values.title);
            fd.set("category", values.category);
            fd.set("file", file);
            startTransition(async () => {
              const result = await uploadEmployeeDocumentAction(fd);
              if (result?.error) {
                setError(result.error);
                return;
              }
              reset();
              setFile(null);
              router.refresh();
            });
          })}
        >
          <p className="text-sm font-medium">Upload document</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register("title")} placeholder="Employment contract" />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="h-9 w-full rounded-lg border px-3 text-sm"
                {...register("category")}
              >
                <option>Contract</option>
                <option>ID</option>
                <option>Policy</option>
                <option>General</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>File (PDF, Word, JPG, PNG - max 5MB)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={pending} className="bg-teal-700 hover:bg-teal-800">
            {pending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      )}
    </div>
  );
}
