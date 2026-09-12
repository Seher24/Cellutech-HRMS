import { readFile } from "fs/promises";
import path from "path";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSubsidiary } from "@/lib/rbac";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await requireSession();
  const { id } = await context.params;
  const doc = await prisma.policyDocument.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  if (doc.scope === "SUBSIDIARY" && !canAccessSubsidiary(actor, doc.subsidiaryId)) {
    if (actor.role !== "SUPER_ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const data = await readFile(path.join(process.cwd(), doc.storagePath));
  return new Response(data, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName}"`,
    },
  });
}
