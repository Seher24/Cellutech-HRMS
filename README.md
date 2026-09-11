# Cellutech HRMS

Multi-subsidiary Human Resource Management System for Cellutech — organization structure, employees, leave approvals, attendance, holidays, policies, and reports in one role-based web app.

**Production:** [https://cellutech-hrms.vercel.app](https://cellutech-hrms.vercel.app)

Made by Seher Siddique for Cellutech.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router (TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | PostgreSQL (Neon in production; Prisma ORM) |
| Auth | Auth.js (NextAuth v5) + JWT sessions + bcrypt |
| Forms | React Hook Form + Zod |
| Hosting | Vercel |

## Getting started (local)

1. Clone the repository and open the project folder.
2. Copy `.env.example` to `.env` and fill in values (see below).
3. Install, migrate, seed, and run:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

On Windows you can also run `.\start.ps1` (or `start.bat`) from the project root.

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres pooled connection string (app runtime) |
| `DATABASE_URL_UNPOOLED` | Postgres direct URL (Prisma migrate) |
| `AUTH_SECRET` | Long random secret used to sign session tokens |
| `AUTH_TRUST_HOST` | Set to `true` (required behind Vercel / proxies) |
| `AUTH_URL` | Public site URL in production (e.g. `https://cellutech-hrms.vercel.app`) |
| `NEXTAUTH_URL` | Same public URL locally or in production |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Demo users are created by the seed script. On Windows, `start.ps1` prints sample emails after seeding. Ask your administrator for credentials in shared environments — do not commit real passwords.

## Signing in and navigating

Use your Cellutech work email (`@cellutechfzco.com`) and password. Navigation is role-aware (sidebar on desktop, menu on mobile).

- **Dashboard** — live metrics and charts for your role  
- **My Profile** — personal details and password change  
- **Notifications** — leave and approval alerts  

## Features

### Organization and employees

- Companies, countries, subsidiaries, departments, and designations  
- Employee directory with search/filters; create, edit, soft-deactivate / reactivate  
- Manager assignment and org chart (subsidiary or global for Super Admin)  
- Employee document uploads (type/size validated)  

### Leave

- Configurable leave types and balances (seeded; balances auto-created when missing)  
- Request leave with working-day calc (weekends + subsidiary holidays excluded)  
- Level-1 manager approval → optional Level-2 department head escalation  
- Subsidiary HR override; cancel pending / future approved requests  
- **Leave Calendar** — managers, department heads, HR, and Super Admin only (coverage / overlaps)  

### Attendance and holidays

- Daily status (present / absent / leave / holiday / remote)  
- Check-in / check-out timesheet punches  
- Per-subsidiary holiday calendars used in leave calculations  

### Policies, announcements, reports

- Policy document vault (global or subsidiary scope)  
- Announcements (global or subsidiary)  
- CSV and PDF exports: headcount, leave, attendance  

## Roles

| Role | Typical use |
|------|-------------|
| Super Admin | Full setup, global views, overrides |
| HR Manager | Subsidiary employees, holidays, announcements, HR leave override |
| Department Head | Escalated leave and department oversight |
| Team Lead | Direct-report leave approval and team views |
| Employee | Own profile, leave, attendance |
| Finance | View-only headcount / attendance / report exports |

## Production (Vercel + Neon)

Required Vercel environment variables (Production):

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`  
- `AUTH_SECRET`, `AUTH_TRUST_HOST=true`  
- `AUTH_URL` and `NEXTAUTH_URL` = `https://cellutech-hrms.vercel.app`  

Build runs `prisma migrate deploy && next build`. After changing env vars, redeploy.

Health check: [https://cellutech-hrms.vercel.app/api/health](https://cellutech-hrms.vercel.app/api/health)

**Note:** Employee/policy file uploads use the local filesystem. On Vercel this storage is ephemeral — use object storage (e.g. Vercel Blob / S3) for durable files in production.

## Development scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Development server |
| `npm run build` | Migrate + production build |
| `npm run db:seed` | Seed demo data |
| `npm run db:deploy` | Apply migrations |
| `npm run db:reset` | Reset DB, migrate, seed |

## Project layout

```
src/app/(app)/     Authenticated pages
src/app/(auth)/    Login
src/lib/           Auth, RBAC, leave workflow, org helpers
prisma/            Schema, migrations, seed
public/            Branding assets
```

## SRS alignment

Built against *HRMS SRS NextJS 2026*. Mandatory assignment scope (§9.1) and should-include items (§9.2) are implemented. See `RELEASE_NOTES.md` for the v1.0 feature list and known limitations.

## Support

Access and role issues: Cellutech HR. Defects and enhancements: internal engineering channel.
