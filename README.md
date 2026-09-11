# Cellutech HRMS

Multi-subsidiary Human Resource Management System built for the Next.js assessment SRS.

## Tech stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** + **SQLite** (swap `provider` to `mysql` for MySQL)
- **Auth.js** (NextAuth v5) Credentials provider
- **React Hook Form** patterns + **Zod** validation
- **Recharts** for dashboards

## Features completed

- Authentication with role-based sessions (Super Admin, HR Manager, Department Head, Team Lead, Employee)
- Organization model: countries, subsidiaries, departments, designations
- Employee lifecycle: directory, profile, onboarding, soft deactivation
- Employee document uploads (PDF/Word/images) with validation
- Reporting hierarchy + subsidiary and global org charts
- Leave management with multi-level approval, escalation, HR override, balances, overlap calendar
- Role-based dashboards with DB-driven Recharts widgets
- Holiday calendars per subsidiary (excluded from leave day counts)
- Simplified attendance status
- In-app notifications for leave events
- Announcement management for Admin/HR
- CSV exports for headcount, leave, and attendance
- React Hook Form + Zod on key forms

## Deferred (documented for future)

- Payroll / Finance officer workflows
- Recruitment / ATS
- Performance management
- PDF report generation (CSV exports are available)

These can extend from the current Prisma schema (users, subsidiaries, leave/attendance already provide payroll inputs).

## Quick start (recommended)

From the `hrms` folder, run either:

```bat
start.bat
```

or:

```powershell
.\start.ps1
```

or:

```bash
npm run demo
```

This will create `.env` if missing, install dependencies, apply migrations, seed demo data, and start the app at [http://localhost:3000](http://localhost:3000).

## Manual setup

```bash
cd hrms
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
```

## Demo logins

Password for **all** seeded users: `Password123!`

| Role | Email |
|------|-------|
| Super Admin (Seher Siddique) | seher.siddique@hrms.pk |
| HR Manager (Karachi) | hr.karachi@hrms.pk |
| Department Head | head.eng@hrms.pk |
| Team Lead | lead.eng@hrms.pk |
| Employee | usman.raza@hrms.pk |

Seed data uses Pakistani employee names across Pakistan (Karachi, Lahore) and UAE (Dubai) subsidiaries.

## Leave approval flow

1. Employee submits a request
2. Routes to direct manager (Level 1)
3. If days exceed leave-type threshold (default 3) or type requires escalation → Department Head (Level 2)
4. Subsidiary HR can override within their subsidiary
5. Approvals write `LeaveApprovalStep` audit rows and update balances on final approve

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:reset` | Reset DB + migrate + seed |

## Project structure

```
src/app/(app)/          # Authenticated pages
src/app/(auth)/login    # Login
src/lib/auth.ts         # Auth.js config
src/lib/rbac.ts         # Permission matrix
src/lib/leave/          # Leave workflow domain
src/lib/org/            # Org hierarchy helpers
prisma/schema.prisma    # Data model
prisma/seed.ts          # Demo data
```
