"use server";

import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary, hasPermission } from "@/lib/rbac";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadEmployeeDocumentAction(formData: FormData) {
  const actor = await requireSession();
  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();
  const file = formData.get("file");

  if (!userId || !title) return { error: "Title and employee are required" };
  if (!(file instanceof File)) return { error: "File is required" };

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee) return { error: "Employee not found" };

  const canManage = hasPermission(actor.role, "manage_employees");
  const isSelf = actor.id === userId;
  if (!isSelf && !canManage) return { error: "Forbidden" };
  if (canManage && !isSelf && !canAccessSubsidiary(actor, employee.subsidiaryId)) {
    return { error: "Forbidden: subsidiary scope" };
  }

  if (file.size > MAX_BYTES) return { error: "File must be 5MB or smaller" };
  if (!ALLOWED.has(file.type)) {
    return { error: "Only PDF, Word, JPG, and PNG files are allowed" };
  }

  const uploadDir = path.join(process.cwd(), "uploads", "documents", userId);
  await mkdir(uploadDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeName}`;
  const storagePath = path.join(uploadDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  await prisma.employeeDocument.create({
    data: {
      userId,
      title,
      category,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storagePath: path.join("uploads", "documents", userId, storedName),
      uploadedById: actor.id,
    },
  });

  revalidatePath(`/employees/${userId}`);
  return { success: true };
}

export async function deleteEmployeeDocumentAction(documentId: string) {
  const actor = await requireSession();
  const doc = await prisma.employeeDocument.findUnique({
    where: { id: documentId },
    include: { user: true },
  });
  if (!doc) return { error: "Document not found" };

  const canManage = hasPermission(actor.role, "manage_employees");
  const isSelf = actor.id === doc.userId;
  if (!isSelf && !canManage) return { error: "Forbidden" };
  if (canManage && !isSelf && !canAccessSubsidiary(actor, doc.user.subsidiaryId)) {
    return { error: "Forbidden" };
  }

  try {
    await unlink(path.join(process.cwd(), doc.storagePath));
  } catch {
    // file may already be missing
  }

  await prisma.employeeDocument.delete({ where: { id: documentId } });
  revalidatePath(`/employees/${doc.userId}`);
  return { success: true };
}
