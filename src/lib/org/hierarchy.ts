import { prisma } from "@/lib/db";

export type OrgNode = {
  id: string;
  name: string;
  title: string;
  email: string;
  role: string;
  department: string | null;
  children: OrgNode[];
};

export async function getManagerChain(userId: string) {
  const chain: { id: string; name: string; email: string }[] = [];
  let currentId: string | null = userId;
  const seen = new Set<string>();

  while (currentId) {
    if (seen.has(currentId)) break;
    seen.add(currentId);
    const user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      managerId: string | null;
    } | null = await prisma.user.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        managerId: true,
      },
    });
    if (!user) break;
    if (user.id !== userId) {
      chain.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
    }
    currentId = user.managerId;
  }

  return chain;
}

export async function getDirectAndIndirectReports(managerId: string) {
  const all = await prisma.user.findMany({
    where: { status: { not: "TERMINATED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      managerId: true,
      role: { select: { name: true } },
      designation: { select: { title: true } },
      department: { select: { name: true } },
    },
  });

  const byManager = new Map<string | null, typeof all>();
  for (const u of all) {
    const key = u.managerId;
    const list = byManager.get(key) ?? [];
    list.push(u);
    byManager.set(key, list);
  }

  const result: typeof all = [];
  const walk = (id: string) => {
    const children = byManager.get(id) ?? [];
    for (const child of children) {
      result.push(child);
      walk(child.id);
    }
  };
  walk(managerId);
  return result;
}

export async function buildOrgTree(subsidiaryId?: string | null): Promise<OrgNode[]> {
  const users = await prisma.user.findMany({
    where: {
      status: { not: "TERMINATED" },
      ...(subsidiaryId ? { subsidiaryId } : {}),
    },
    include: {
      role: true,
      designation: true,
      department: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const nodes = new Map<string, OrgNode>();
  for (const u of users) {
    nodes.set(u.id, {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      title: u.designation?.title ?? u.role.description ?? u.role.name,
      email: u.email,
      role: u.role.name,
      department: u.department?.name ?? null,
      children: [],
    });
  }

  const roots: OrgNode[] = [];
  for (const u of users) {
    const node = nodes.get(u.id)!;
    if (u.managerId && nodes.has(u.managerId)) {
      nodes.get(u.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
