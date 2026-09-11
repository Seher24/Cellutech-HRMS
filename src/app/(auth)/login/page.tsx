import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(30,64,175,0.35),_transparent_45%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-10 text-white md:flex">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
              Cellutech HRMS
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">
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
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="mb-8 md:hidden">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Cellutech HRMS
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your company credentials
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
