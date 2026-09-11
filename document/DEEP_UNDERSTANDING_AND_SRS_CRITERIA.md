# Cellutech HRMS - Deep Understanding Guide

Use this document to explain the system in interviews, demos, and SRS reviews. It maps architecture, flows, and which SRS sections / evaluation criteria you meet.

---

## 1. One-minute elevator pitch

**Cellutech HRMS** is a multi-subsidiary HR web app for an international company. It centralizes employees, org structure, leave approvals (with multi-level escalation), holidays, attendance, and role-based dashboards in one Next.js full-stack product.

- **Brand:** Cellutech  
- **Super Admin (seeded):** Seher Siddique (`seher.siddique@hrms.pk`)  
- **Stack:** Next.js App Router, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite, Auth.js, Zod, Recharts  

---

## 2. Problem the product solves

Companies with offices in multiple countries need:

1. One place to manage people across subsidiaries  
2. Leave that follows the real reporting line (manager, then department head when needed)  
3. Local holiday calendars (Pakistan vs UAE differ)  
4. Different screens for Admin, HR, managers, and employees  

This app models that hierarchy and enforces it in both UI and server actions.

---

## 3. Architecture (how to explain it)

```
Browser UI (React Server + Client Components)
        |
        v
Next.js App Router
  - Pages under src/app/(app) and (auth)
  - Middleware: redirect unauthenticated users to /login
  - Server Actions: mutations (leave, employees, org)
        |
        v
Domain libraries
  - src/lib/auth.ts      Auth.js (credentials + JWT session with role)
  - src/lib/rbac.ts      Permission matrix
  - src/lib/leave/       Leave workflow (submit, escalate, approve)
  - src/lib/org/         Manager chain + org tree
        |
        v
Prisma ORM  -->  SQLite (prisma/dev.db)
```

**Why monolithic Next.js?**  
SRS asks for App Router + Route Handlers / Server Actions. One deployable app is enough for the assessment and keeps auth, UI, and DB logic together.

**Why SQLite?**  
Allowed by SRS (MySQL or SQLite). Zero setup for reviewers. Schema can switch to MySQL by changing the Prisma `provider`.

---

## 4. Folder map (know these paths)

| Path | Purpose |
|------|---------|
| `src/app/(auth)/login` | Login page |
| `src/app/(app)/dashboard` | Role-based dashboards + charts |
| `src/app/(app)/employees` | Directory, profile, my profile |
| `src/app/(app)/org-chart` | Reporting tree |
| `src/app/(app)/leave/*` | Request, my requests, approvals, calendar |
| `src/app/(app)/organization` | Countries, subsidiaries, depts |
| `src/app/(app)/holidays` | Subsidiary holidays |
| `src/app/(app)/attendance` | Daily status |
| `src/app/(app)/notifications` | In-app alerts |
| `src/lib/leave/workflow.ts` | Core leave business rules |
| `src/lib/rbac.ts` | Who can do what |
| `prisma/schema.prisma` | Data model |
| `prisma/seed.ts` | Demo data |
| `start.ps1` / `start.bat` | One-click demo startup |

---

## 5. Roles and permissions (memorize this)

| Role | Scope | Typical actions |
|------|--------|-----------------|
| SUPER_ADMIN | All subsidiaries | Countries/subsidiaries, global dashboard, override leave |
| HR_MANAGER | Own subsidiary | Employees, depts, holidays, HR leave override |
| DEPARTMENT_HEAD | Own department | L2 escalated leave, team/dept view |
| TEAM_LEAD | Direct reports | L1 leave approval, team dashboard |
| EMPLOYEE | Self | Apply leave, own profile, own dashboard |

Permissions live in `src/lib/rbac.ts`. Server Actions call `requirePermission` or workflow checks so hiding a nav link is not the only security.

**Demo login (password for all):** `Password123!`

| Role | Email |
|------|-------|
| Super Admin | seher.siddique@hrms.pk |
| HR Manager | hr.karachi@hrms.pk |
| Dept Head | head.eng@hrms.pk |
| Team Lead | lead.eng@hrms.pk |
| Employee | usman.raza@hrms.pk |

---

## 6. Data model (explain relationships)

```
Country 1---* Subsidiary 1---* Department 1---* Designation
                |
                *--- User (employee)
                       |
                       managerId --> User (self-relation)
                       |
                       *--- LeaveBalance, LeaveRequest, Attendance, Notification

LeaveRequest 1---* LeaveApprovalStep (audit: level, decision, comment, time)
LeaveType (quotas, escalation flags)
Holiday (per subsidiary)
Announcement (global or subsidiary)
```

**Key interview points:**

- `User.managerId` builds the org chart and Level-1 approver.  
- `LeaveApprovalStep` is the audit trail for multi-level approval.  
- Holidays belong to a subsidiary and are excluded when counting leave working days.  
- Soft offboarding uses `status = TERMINATED` (history kept).  

---

## 7. Leave workflow (highest weighted topic - 25%)

Be ready to walk this end-to-end.

1. Employee submits type, dates, reason (`/leave/request`).  
2. System counts **working days** (skip weekends + subsidiary holidays).  
3. Checks leave balance.  
4. Creates `LeaveRequest` with status `PENDING` and Level-1 step for **direct manager**.  
5. Manager approves/rejects on `/leave/approvals`.  
6. If days > threshold (default 3) OR leave type `requiresEscalation`:  
   - After L1 approve, status becomes `PENDING_L2`  
   - New step for **Department Head** in same department  
7. Final approve: status `APPROVED`, balance `used` increases, employee notified.  
8. Reject: status `REJECTED`, notify employee.  
9. HR (same subsidiary) can **override** pending requests.  

**Code to cite:** `src/lib/leave/workflow.ts`

**Seeded demos:** Usman has a pending L1 request; Sara has an escalated L2 request.

---

## 8. Org chart and hierarchy

- Every employee (except top) has one `managerId`.  
- `buildOrgTree(subsidiaryId)` nests users under managers.  
- Super Admin picks a subsidiary; others see their own.  
- Employee profile shows **manager chain** upward.  

**Code:** `src/lib/org/hierarchy.ts`, `/org-chart`

---

## 9. Dashboards (dynamic, not fake)

Charts use **Recharts** and real Prisma aggregates.

| Role | Dashboard focus |
|------|-----------------|
| Super Admin | Global headcount, by subsidiary, pending leave |
| HR / Dept Head | Headcount by dept, pending leave, holidays, attendance |
| Team Lead | Reports, pending approvals, present today |
| Employee | Leave balances, my requests, holidays, announcements |

**Code:** `src/app/(app)/dashboard/page.tsx`, `src/components/charts/dashboard-charts.tsx`

---

## 10. Auth and security talking points

- Passwords hashed with **bcrypt** (never stored plain).  
- Auth.js **JWT session** carries `id`, `role`, `subsidiaryId`, `departmentId`.  
- Middleware sends guests to `/login`.  
- Mutations validate with **Zod** and check RBAC on the server.  
- Secrets in `.env` (see `.env.example`).  

---

## 11. How to start and demo

```bat
start.bat
```

or `.\start.ps1` or `npm run demo`

This installs deps if needed, migrates, seeds, and runs http://localhost:3000.

**Suggested live demo path (5-7 minutes):**

1. Login as `usman.raza@hrms.pk` - employee dashboard, request leave.  
2. Login as `lead.eng@hrms.pk` - Approvals, approve/reject.  
3. Login as `head.eng@hrms.pk` - escalated L2 if applicable.  
4. Login as `hr.karachi@hrms.pk` - employees, holidays, subsidiary dashboard.  
5. Login as `seher.siddique@hrms.pk` - global dashboard, org chart switcher, organization admin.  

---

## 12. SRS compliance matrix (what each section meets)

### Evaluation criteria (§9.5) - how you score

| Criterion | Weight | Status | How we meet it |
|-----------|--------|--------|----------------|
| Leave approval hierarchy + reporting structure | 25% | **Met** | `workflow.ts`, `managerId`, org chart, approval steps |
| Code quality, structure, TypeScript | 20% | **Met** | Typed app, domain folders, Prisma types |
| UI/UX + Tailwind + shadcn/ui | 20% | **Met** | shadcn components, Cellutech shell, responsive nav |
| Database design + ORM | 15% | **Met** | Full §6-style schema via Prisma/SQLite |
| Dashboards genuinely dynamic | 10% | **Met** | Recharts from Prisma queries |
| README + easy to run | 10% | **Met** | README + `start.bat` / seed / demo creds |

### Assignment mandatory (§9.1)

| Requirement | Status | Where |
|-------------|--------|-------|
| Auth with ≥3 roles | **Met** | 5 roles + seeded users |
| 2 countries, 2+ subsidiaries, depts, reporting chain | **Met** | PK + UAE; Karachi, Lahore, Dubai |
| Leave E2E with escalation | **Met** | Leave module |
| ≥2 role dashboards with live charts | **Met** | `/dashboard` |
| Org chart from seed hierarchy | **Met** | `/org-chart` |

### Should include (§9.2)

| Requirement | Status |
|-------------|--------|
| Holiday calendar per subsidiary | **Met** |
| Attendance (simplified) | **Met** |
| Notifications on leave changes | **Met** |

### Explicitly deferred (§9.3) - OK not to build

| Module | Status |
|--------|--------|
| Payroll | Documented in README as future |
| Recruitment / ATS | Documented as future |
| Performance management | Documented as future |

### Functional requirements (§3)

| Section | Topic | Status | Notes |
|---------|-------|--------|-------|
| 3.1 | Auth and access control | **Met** | bcrypt, RBAC, middleware, role nav |
| 3.2 | Org / subsidiary / dept management | **Met** | `/organization` create flows |
| 3.3 | Employee lifecycle | **Mostly met** | Onboard, profile, deactivate; no file attachments |
| 3.4 | Reporting hierarchy and org chart | **Mostly met** | Per-subsidiary chart; manager chain |
| 3.5 | Leave management | **Met (core)** | Multi-level, balances, audit; calendar is list-based |
| 3.6 | Holiday calendar | **Met** | Per subsidiary + leave day exclusion |
| 3.7 | Attendance and timesheet | **Partially met** | Daily status; not full timesheet hours |
| 3.8 | Role-based dashboards | **Met** | Live widgets |
| 3.9 | Notifications and announcements | **Mostly met** | Leave notifications + seeded announcements (read); no full announcement CRUD UI |
| 3.10 | Document and asset management | **Not built** | Deferred in README |
| 3.11 | Reports and exports CSV/PDF | **Not built** | Deferred in README |

### Tech stack (§1.6)

| Technology | Status |
|------------|--------|
| Next.js App Router + TypeScript | **Met** |
| Tailwind + shadcn/ui | **Met** |
| Recharts | **Met** |
| SQLite + Prisma | **Met** |
| Auth.js with role sessions | **Met** |
| Zod validation | **Met** |
| React Hook Form | **Partial** | Package present; forms mainly FormData + Zod on server |
| Server Components / Server Actions | **Met** |

### UI screens (§8.2)

| Screen | Status |
|--------|--------|
| Login | Met |
| Role dashboards | Met |
| Employee directory + filters | Met |
| Employee profile | Met |
| Org chart | Met |
| Leave request | Met |
| Approvals queue | Met |
| Leave calendar | Met (table view of approved leave) |
| Subsidiary / dept management | Met |

### Deliverables (§9.4 / §10)

| Deliverable | Status |
|-------------|--------|
| Runnable source | Met |
| README setup + demo users + completed vs deferred | Met |
| Seed data | Met |
| `.env.example` | Met |
| One-click start script | Met (`start.bat` / `start.ps1`) |

---

## 13. Likely questions and strong answers

**Q: Why SQLite not MySQL?**  
A: SRS allows either. SQLite is file-based so reviewers run with zero DB install. Prisma schema is portable; change `provider` to `mysql` and update `DATABASE_URL`.

**Q: How is leave escalation decided?**  
A: After Level-1 approve, if `totalDays > leaveType.escalationThresholdDays` or `requiresEscalation` is true, we create Level-2 for the Department Head in the same department.

**Q: Is RBAC only in the UI?**  
A: No. Nav is role-aware, but Server Actions and leave workflow also check role and subsidiary scope.

**Q: How do holidays affect leave?**  
A: `countWorkingDays` skips Saturdays, Sundays, and dates in the subsidiary `Holiday` table.

**Q: What did you deliberately not build?**  
A: Payroll, ATS, performance (SRS §9.3). Also document vault and CSV/PDF exports are deferred; architecture can extend via new models/pages.

**Q: How would you add MySQL in production?**  
A: Set Prisma provider to mysql, point `DATABASE_URL` to managed MySQL, run migrate, keep the same app code.

**Q: Where is business logic?**  
A: Domain libs (`leave/workflow.ts`, `org/hierarchy.ts`, `rbac.ts`), not buried only in React components.

**Q: Who is the admin?**  
A: Seher Siddique, Super Admin, `seher.siddique@hrms.pk`.

---

## 14. Honest limitations (say this confidently)

If asked what is incomplete versus the full vision SRS:

1. No employee document uploads (§3.10)  
2. No CSV/PDF report exports (§3.11)  
3. Attendance is status-based, not hourly timesheet  
4. Announcements are displayed/seeded; Admin create UI is thin/absent  
5. Leave "calendar" is an approved-leave list, not a full visual overlap calendar  
6. React Hook Form is not used on every form (Zod + Server Actions are)  

These do **not** block the mandatory assignment criteria (§9.1-9.2, §9.5).

---

## 15. Cheat sheet - files to open during oral review

1. `prisma/schema.prisma` - data design  
2. `src/lib/leave/workflow.ts` - leave brain  
3. `src/lib/rbac.ts` - permissions  
4. `src/app/(app)/dashboard/page.tsx` - live metrics  
5. `prisma/seed.ts` - demo world  
6. `README.md` - how to run  

---

*Document version: Cellutech HRMS assessment pack*
