# Cellutech HRMS

Cellutech HRMS is the internal people system for Cellutech subsidiaries. Use it to manage organization structure, employees, leave, attendance, holidays, policies, and operational reports from one place.

Access is role based. What you see in the sidebar depends on your account. After you sign in, start from the dashboard and open the module you need from the left navigation (or the menu on smaller screens).

## Getting started

1. Clone the repository and open the project folder.
2. Copy `.env.example` to `.env` and set `AUTH_SECRET` to a long random value.
3. Install dependencies, apply migrations, and start the app:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

On Windows you can also run `start.bat` or `.\start.ps1` from the project root. Those scripts prepare the environment and launch the development server.

Open [http://localhost:3000](http://localhost:3000) and sign in with the account issued by your administrator.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma database connection (SQLite file path by default) |
| `AUTH_SECRET` | Secret used to sign session tokens |
| `AUTH_TRUST_HOST` | Set to `true` for local development |
| `NEXTAUTH_URL` | Public URL of the app (for example `http://localhost:3000`) |

SQLite is the default database. To use MySQL later, change the Prisma `provider` and point `DATABASE_URL` at your MySQL instance.

## Signing in and navigating

Use the login page with your company email and password. Once inside:

- **Dashboard** shows metrics and charts for your role.
- **My Profile** lets you review and update your personal details.
- **Notifications** lists leave and approval alerts. Unread counts appear in the header.
- Use **Sign out** in the header when you finish.

On phones and tablets, open the menu button in the header to reach the same sections.

## Organization and employees

### Organization

Super Admin and HR can open **Organization** to maintain companies, countries, subsidiaries, and departments. Keep subsidiaries active only while they are operational. Deactivated subsidiaries stay in history but should not be used for new hiring.

### Employees

Open **Employees** to search the directory, filter by status, and open a profile.

HR and Super Admin can onboard a new person from this page: name, email, role, subsidiary, department, designation, manager, and joining date. Profiles support soft deactivation when someone leaves.

On an employee profile you can upload documents such as contracts or ID copies. Files are type and size checked before storage.

### Org chart

**Org Chart** shows the reporting tree for your subsidiary. Super Admin can switch to a global view across subsidiaries when needed.

## Leave

### Request leave

Employees open **Request Leave**, choose the leave type and dates, and submit a reason. Working days exclude weekends and subsidiary holidays. The system checks your remaining balance before accepting the request.

### My leave

**My Leave** lists your requests and their approval trail. You can cancel a pending request, or an approved request that has not started yet. Cancelling an approved future request restores balance.

### Approvals

Managers and department heads open **Approvals** to review items in their queue. Typical path:

1. Direct manager decides at Level 1.
2. Longer or escalated leave moves to the department head at Level 2.
3. Subsidiary HR can override within their own subsidiary when policy requires it.

Each decision is stored with optional comments for audit.

### Leave calendar

**Leave Calendar** shows approved leave so teams can spot coverage gaps and overlaps before planning time off.

## Attendance and holidays

### Attendance

**Attendance** is for daily status and timesheet punches. Check in when you start work and check out when you finish. You can also mark the day as present, remote, leave, holiday, or absent. Managers and HR see records in their scope; Finance can review subsidiary attendance for payroll inputs.

### Holidays

**Holidays** lists public holidays for a subsidiary. HR configures these dates so leave calculations skip them automatically.

## Policies, announcements, and reports

### Policies

**Policies** is the document vault for handbooks and HR policies. Everyone can download published files. Admin and HR upload or remove documents and choose global or subsidiary scope.

### Announcements

Admin and HR publish announcements under **Announcements**. Posts can be global or limited to one subsidiary. Existing posts can be edited or removed.

### Reports

Roles with export access open **Reports** to download headcount, leave, and attendance as CSV or PDF. Exports follow the same subsidiary and role scope as the rest of the app.

## Roles at a glance

| Role | Typical use |
|------|-------------|
| Super Admin | Full organization setup, global views, overrides |
| HR Manager | Subsidiary employees, holidays, announcements, HR leave override |
| Department Head | Escalated leave approval and department oversight |
| Team Lead / Line Manager | Direct report leave approval and team view |
| Employee | Own profile, leave requests, attendance punches |
| Finance | View subsidiary headcount, attendance, and report exports |

Exact menu items and actions follow the permission matrix in the application. If a page is missing from your sidebar, your role is not meant to manage that area.

## Day to day tips

- Prefer the dashboard first thing in the morning for pending leave and headcount signals.
- Confirm holidays for your subsidiary before planning long leave.
- Keep manager assignments current so leave routes to the right approver.
- Use notifications instead of email threads for approval status.
- Download reports at month end for payroll and compliance archives.

## Development scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run db:seed` | Load seed data into the database |
| `npm run db:reset` | Reset the database, migrate, and seed |

## Project layout

```
src/app/(app)/     Authenticated application pages
src/app/(auth)/    Login
src/lib/           Auth, RBAC, leave workflow, org helpers
prisma/            Schema, migrations, seed
public/            Static assets including branding
```

## Support

For access issues, role changes, or data corrections, contact your Cellutech HR administrator. Application defects and enhancement requests should go through your internal engineering channel.

Made by Seher Siddique for Cellutech.
