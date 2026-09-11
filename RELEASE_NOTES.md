# Cellutech HRMS — Release Notes

## v1.0.0 — Initial production release

**Date:** September 2026  
**Production URL:** https://cellutech-hrms.vercel.app  
**Repository:** https://github.com/Seher24/Cellutech-HRMS  

Cellutech HRMS is a multi-subsidiary people platform for Cellutech FZCO: organization structure, employee lifecycle, multi-level leave approvals, attendance, holidays, policies, announcements, and role-scoped analytics/reports.

---

### Highlights

- Full **role-based** HR workspace (Super Admin, HR Manager, Department Head, Team Lead, Employee, Finance)
- **PostgreSQL on Neon** with Prisma migrations; deployed on **Vercel**
- End-to-end **leave workflow** with manager approval, department-head escalation, HR override, and audit trail
- **Live dashboards** (Recharts) driven by database data, not mock JSON
- Responsive UI (desktop fixed sidebar + mobile navigation)
- Secure **password change** (current + new + confirm) with show/hide toggles

---

### What’s included

#### Authentication & security
- Email/password login (`@cellutechfzco.com` work email UX)
- Passwords hashed with bcrypt; Auth.js (NextAuth v5) JWT sessions
- Server-side RBAC on pages and server actions; middleware route protection
- Profile password change with current-password verification
- Environment-based secrets (`AUTH_SECRET`, Neon URLs) — nothing sensitive committed

#### Organization
- Company, country, subsidiary, department, and designation model
- Subsidiary create / edit / activate-deactivate
- Department and designation create / edit / delete (with safety checks when staff are assigned)
- Multi-country seed (e.g. Pakistan + UAE) and multiple subsidiaries (Karachi, Lahore, Dubai)

#### Employees
- Directory with search and filters
- Onboard employees with role, org placement, manager, and credentials
- Edit profiles; soft deactivate and reactivate
- Manager chain on profile; org chart (subsidiary + global for Super Admin)
- Employee document upload with type/size validation

#### Leave
- Leave types and yearly balances (seeded; balances ensured when missing)
- Request leave with working-day calculation (weekends + subsidiary holidays excluded)
- Level-1 → direct manager; Level-2 → department head when escalation rules apply
- HR override within subsidiary; cancel pending / future approved requests
- Leave calendar with overlap highlighting for **managers, department heads, HR, and Super Admin only**
- My Leave approval trail for employees

#### Attendance & holidays
- Daily attendance statuses (present, absent, leave, holiday, remote)
- Check-in / check-out timesheet punches
- Per-subsidiary holiday calendars managed by HR/Admin

#### Communication & documents
- In-app notifications (leave / approvals) with unread badge
- Global or subsidiary announcements (Admin/HR CRUD)
- Policy document vault (upload/download; scoped global or subsidiary)

#### Analytics & reports
- Role-specific dashboards with real metrics and charts
- CSV and PDF exports for headcount, leave summary, and attendance

#### Platform
- Next.js App Router, TypeScript, Tailwind + shadcn/ui
- Prisma ORM + PostgreSQL
- Seed script for demo org data
- Production health endpoint: `/api/health`

---

### Deployment

| Component | Service |
|-----------|---------|
| App | Vercel |
| Database | Neon PostgreSQL |
| Build | `prisma migrate deploy && next build` |

Required production env: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `NEXTAUTH_URL`.

---

### Breaking / migration notes (v1.0)

- Database provider is **PostgreSQL** (not SQLite). Local and production should use Postgres connection strings.
- After switching databases, users must **sign out and sign in again** so session user IDs match Neon.
- Leave Calendar is no longer shown to regular Employee or Finance roles.

---

### Known limitations

| Area | Limitation |
|------|------------|
| Leave types | Seeded and used in workflow; no dedicated HR admin CRUD screen yet |
| Company / country | Create supported; limited edit/deactivate UI |
| File storage | Uploads stored on local disk; **ephemeral on Vercel** — use object storage for durable production files |
| i18n | Timezone/currency per subsidiary; UI strings are English-only |
| Payroll / ATS / performance | Out of SRS assignment scope; not built |

---

### SRS status

Aligned with *HRMS SRS NextJS 2026*:

- **§9.1 Mandatory** — complete  
- **§9.2 Should include** — complete (holidays, attendance, notifications)  
- **§9.3** — payroll/ATS/performance deferred by design  

---

### Upgrade / run locally

```bash
npm install
cp .env.example .env   # set Postgres + AUTH_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev
```

See `README.md` for full usage and operations guidance.

---

### Credits

**Author:** Seher Siddique  
**Organization:** Cellutech  

Thank you to reviewers and stakeholders evaluating this release.
