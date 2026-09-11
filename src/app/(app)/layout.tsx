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
    <div className="flex min-h-screen overflow-x-hidden bg-[#f4f7fb]">
      <div className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 self-start lg:block">
        <AppSidebar role={session.user.role} userName={session.user.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
