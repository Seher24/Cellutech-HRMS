import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-[#f4f7fb]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <AppSidebar role={session.user.role} userName={session.user.name} />
      </div>
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-64">
        <AppHeader />
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
