"use server";

import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary, hasPermission, requirePermission } from "@/lib/rbac";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadPolicyDocumentAction(formData: FormData) {
  const actor = await requireSession();
  requirePermission(actor, "manage_announcements");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "Policy").trim();
  const description = String(formData.get("description") ?? "").trim();
  const scope = String(formData.get("scope") ?? "GLOBAL") as "GLOBAL" | "SUBSIDIARY";
  const subsidiaryId = String(formData.get("subsidiaryId") ?? "") || null;
  const file = formData.get("file");

  if (!title) return { error: "Title is required" };
  if (!(file instanceof File)) return { error: "File is required" };
  if (file.size > MAX_BYTES) return { error: "File must be 8MB or smaller" };
  if (!ALLOWED.has(file.type)) return { error: "Only PDF, Word, JPG, and PNG allowed" };

  if (scope === "GLOBAL" && actor.role !== "SUPER_ADMIN") {
    return { error: "Only Super Admin can upload global policies" };
  }
  if (scope === "SUBSIDIARY") {
    if (!subsidiaryId || !canAccessSubsidiary(actor, subsidiaryId)) {
      return { error: "Forbidden subsidiary scope" };
    }
  }

  const uploadDir = path.join(process.cwd(), "uploads", "policies");
  await mkdir(uploadDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeName}`;
  const relative = path.join("uploads", "policies", storedName);
  await writeFile(path.join(process.cwd(), relative), Buffer.from(await file.arrayBuffer()));

  await prisma.policyDocument.create({
    data: {
      title,
      category,
      description: description || null,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storagePath: relative,
      scope,
      subsidiaryId: scope === "SUBSIDIARY" ? subsidiaryId : null,
      uploadedById: actor.id,
    },
  });

  revalidatePath("/policies");
  return { success: true };
}

export async function deletePolicyDocumentAction(id: string) {
  const actor = await requireSession();
  requirePermission(actor, "manage_announcements");

  const doc = await prisma.policyDocument.findUnique({ where: { id } });
  if (!doc) return { error: "Not found" };
  if (doc.scope === "GLOBAL" && actor.role !== "SUPER_ADMIN") {
    return { error: "Forbidden" };
  }
  if (doc.scope === "SUBSIDIARY" && !canAccessSubsidiary(actor, doc.subsidiaryId)) {
    return { error: "Forbidden" };
  }

  try {
    await unlink(path.join(process.cwd(), doc.storagePath));
  } catch {
    // ignore missing file
  }

  await prisma.policyDocument.delete({ where: { id } });
  revalidatePath("/policies");
  return { success: true };
}
