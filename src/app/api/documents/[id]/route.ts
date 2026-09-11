import { readFile } from "fs/promises";
import path from "path";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary, hasPermission } from "@/lib/rbac";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await requireSession();
  const { id } = await context.params;

  const doc = await prisma.employeeDocument.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!doc) return new Response("Not found", { status: 404 });

  const canManage = hasPermission(actor.role, "manage_employees");
  const isSelf = actor.id === doc.userId;
  if (!isSelf && !canManage) return new Response("Forbidden", { status: 403 });
  if (canManage && !isSelf && !canAccessSubsidiary(actor, doc.user.subsidiaryId)) {
    return new Response("Forbidden", { status: 403 });
  }

  const absolute = path.join(process.cwd(), doc.storagePath);
  const data = await readFile(absolute);

  return new Response(data, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName}"`,
    },
  });
}
