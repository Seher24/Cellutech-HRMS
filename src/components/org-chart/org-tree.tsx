"use client";

import { cn } from "@/lib/utils";
import type { OrgNode } from "@/lib/org/hierarchy";

export function OrgTree({ nodes }: { nodes: OrgNode[] }) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No employees found for this subsidiary.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4 [-webkit-overflow-scrolling:touch]">
      <div className="min-w-0 space-y-6 sm:min-w-fit">
        {nodes.map((node) => (
          <OrgNodeView key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function OrgNodeView({ node, depth }: { node: OrgNode; depth: number }) {
  return (
    <div className={cn(depth > 0 && "ml-3 border-l border-slate-200 pl-3 sm:ml-4 sm:pl-4 md:ml-8")}>
      <div className="mb-3 inline-block w-full max-w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-[220px] sm:w-auto sm:p-4">
        <div className="truncate text-sm font-semibold text-slate-900">{node.name}</div>
        <div className="truncate text-xs text-teal-700">{node.title}</div>
        <div className="mt-1 truncate text-[11px] text-slate-500">
          {node.department ?? node.role.replaceAll("_", " ")}
        </div>
        <div className="truncate text-[11px] text-slate-400">{node.email}</div>
      </div>
      {node.children.length > 0 && (
        <div className="space-y-3">
          {node.children.map((child) => (
            <OrgNodeView key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
