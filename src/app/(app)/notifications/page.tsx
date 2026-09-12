import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MarkReadButton } from "@/components/notifications/mark-read-button";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Notifications</h2>
          <p className="text-sm text-slate-500">Leave updates and approval alerts</p>
        </div>
        <MarkReadButton />
      </div>
      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 shadow-sm ${
              n.isRead ? "border-slate-100 bg-white" : "border-teal-100 bg-teal-50/40"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 break-words">{n.title}</p>
                <p className="text-sm text-slate-600 break-words">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.createdAt.toLocaleString()}
                </p>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  className="shrink-0 text-sm text-teal-700 hover:underline"
                >
                  Open
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
