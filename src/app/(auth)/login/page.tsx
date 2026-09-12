import { LoginForm } from "@/components/auth/login-form";
import { CellutechLogo } from "@/components/brand/cellutech-logo";
import { MadeByCredit } from "@/components/brand/made-by-credit";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(30,64,175,0.35),_transparent_45%)]" />
      <div className="relative w-full max-w-5xl space-y-4">
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-10 text-white md:flex">
            <div>
              <CellutechLogo size="lg" showWordmark />
              <h1 className="mt-8 text-3xl font-semibold leading-tight tracking-tight">
                People operations across every subsidiary
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Manage organization structure, leave approvals, and workforce
                insights for Pakistan and international offices - in one secure
                workspace.
              </p>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <p>Demo password for all users: Password123!</p>
              <p>seher.siddique@hrms.pk · hr.karachi@hrms.pk · usman.raza@hrms.pk</p>
              <MadeByCredit className="pt-2 text-slate-500" />
            </div>
          </div>
          <div className="flex flex-col p-5 sm:p-8 md:p-10">
            <div className="mb-8 md:hidden">
              <CellutechLogo size="md" showWordmark tone="onLight" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your company credentials
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
            <MadeByCredit tone="onLight" className="mt-auto pt-8 text-center md:hidden" />
          </div>
        </div>
        <MadeByCredit className="hidden text-center text-slate-500 md:block" />
      </div>
    </div>
  );
}
