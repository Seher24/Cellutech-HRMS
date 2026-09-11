# Cellutech HRMS - Project Description and Features

## Project name

**Cellutech HRMS** (Human Resource Management System)

## Overview

Cellutech HRMS is a modern, full-stack web application that helps an international organization manage people operations across multiple subsidiaries and countries. It brings organization structure, employee records, leave approvals, holiday calendars, attendance, notifications, and analytics into one secure, role-based platform.

The product is built as a production-style assessment application using the Next.js App Router, TypeScript, Prisma, and Auth.js, with a clean enterprise UI based on Tailwind CSS and shadcn/ui.

---

## Business context

Cellutech operates through local offices (subsidiaries) in different countries and cities. Each subsidiary has its own departments, employees, and public holidays, while a global Super Admin layer needs visibility across the whole company.

Typical users include:

- Global Super Admin  
- Subsidiary HR Managers  
- Department Heads  
- Team Leads / Line Managers  
- Employees  

Each role sees only the navigation, data, and actions they are allowed to use.

---

## Goals

1. Centralize core HR workflows in one responsive web app  
2. Reflect real reporting lines in org charts and leave approvals  
3. Support multi-country / multi-subsidiary data  
4. Provide live, role-specific dashboards (not static mock charts)  
5. Stay easy to install and demo (SQLite + seed + start script)  

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | SQLite (MySQL-ready via Prisma) |
| ORM | Prisma |
| Authentication | Auth.js (NextAuth v5) Credentials + JWT role session |
| Validation | Zod (server actions) |
| Runtime data | React Server Components + Server Actions |

---

## Key features

### 1. Authentication and access control

- Email / password login  
- Passwords stored with bcrypt hashing  
- Session-based protection (unauthenticated users redirected to login)  
- Role-based access control (RBAC) on navigation and server actions  
- Role-aware sidebar and mobile menu  

### 2. Multi-subsidiary organization management

- Countries and subsidiaries (with city, timezone, currency)  
- Departments and job designations per subsidiary  
- Super Admin can manage countries and subsidiaries  
- HR Manager can manage departments and designations in their subsidiary  

### 3. Employee lifecycle

- Employee directory with search and filters  
- Profile details: name, contact, subsidiary, department, designation, joining date, status  
- Reporting manager assignment (`managerId`)  
- Onboarding: create employee + login credentials + leave balances  
- Offboarding: deactivate employee (`TERMINATED`) while keeping history  
- Employees can update their own profile  

### 4. Reporting hierarchy and organization chart

- Each employee has one direct manager  
- Interactive hierarchical org chart per subsidiary  
- Super Admin can switch subsidiary view  
- Manager chain shown on employee profiles  

### 5. Leave management (core module)

Configurable leave types, including:

- Annual / Vacation  
- Sick  
- Casual  
- Unpaid  
- Maternity / Paternity  
- Bereavement  
- Work From Home  

Workflow:

1. Employee submits a request  
2. Request goes to direct Team Lead / manager (Level 1)  
3. Longer or special leave types escalate to Department Head (Level 2)  
4. Subsidiary HR can override within their subsidiary  
5. Every decision is logged (approver, level, comment, timestamp)  
6. Leave balances update on final approval  
7. Working days exclude weekends and subsidiary holidays  

Screens:

- Request leave  
- My leave (status + approval trail)  
- Approvals queue  
- Leave calendar (approved leave in scope)  

### 6. Holiday calendar

- Separate public holidays per subsidiary  
- Used automatically in leave day calculations  
- Managed by HR / Super Admin  

### 7. Attendance

- Simplified daily status: Present, Absent, Leave, Holiday, Remote  
- Employees can mark today  
- Managers / HR can review recent attendance in their scope  

### 8. Role-based dashboards and analytics

Live charts and metrics from the database:

- **Super Admin:** global headcount, by subsidiary, pending leave  
- **HR / Department Head:** department headcount, leave pressure, holidays, attendance  
- **Team Lead:** team size, pending approvals, present today  
- **Employee:** leave balances, recent requests, holidays, announcements  

### 9. Notifications and announcements

- In-app notifications for leave submission, escalation, approval, and rejection  
- Company / subsidiary announcements shown on dashboards (seeded and readable)  

---

## Seeded demo world

Out of the box, the app includes:

- **Countries:** Pakistan, United Arab Emirates  
- **Subsidiaries:** Karachi HQ, Lahore Office, Dubai Office  
- Departments such as Engineering, Sales, HR, Finance  
- Pakistani employee names across the hierarchy  
- Sample leave requests (pending and escalated)  
- Local holidays and sample attendance  

**Super Admin:** Seher Siddique  
**Email:** seher.siddique@hrms.pk  
**Password (all demo users):** Password123!

---

## User journeys (feature view)

### Employee

Login → My dashboard → Request leave → Track status → Mark attendance → View holidays / org chart  

### Team Lead

Login → Team dashboard → Approve or reject leave → View team leave calendar → Review attendance  

### Department Head

Login → Department overview → Handle escalated leave → Review department people  

### HR Manager

Login → Subsidiary dashboard → Manage employees / departments → Holidays → Leave overrides  

### Super Admin

Login → Global dashboard → Organization setup → Cross-subsidiary org chart → System-wide visibility  

---

## How to run

From the `hrms` folder:

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

Then open http://localhost:3000

---

## What is intentionally out of scope (for now)

Documented for future expansion (SRS deferred modules):

- Payroll / finance officer workflows  
- Recruitment / ATS  
- Performance management  
- Full document vault and CSV/PDF report exports  

The current schema and architecture are designed so these modules can be added without redesigning the core org and leave model.

---

## Project highlights for stakeholders

- Multi-country, multi-subsidiary ready  
- Real leave approval hierarchy (not a single approve button)  
- Dynamic dashboards driven by database data  
- Professional Cellutech-branded UI  
- One-command demo startup for reviewers  

---

## Repository layout (high level)

```
hrms/
  document/          Project documentation (this folder)
  prisma/            Schema, migrations, seed
  src/app/           Pages (login + authenticated app)
  src/components/    UI and feature components
  src/lib/           Auth, RBAC, leave, org helpers, actions
  start.bat          Windows one-click starter
  start.ps1          PowerShell starter
  README.md          Setup and demo credentials
```

---

## Summary

Cellutech HRMS is a complete assessment-ready HR platform focused on organization structure, employee management, multi-level leave, holidays, attendance, notifications, and role-based analytics. It is built with a modern Next.js stack, seeded for immediate demonstration, and documented for both technical and business audiences.

---

*Related document:* `DEEP_UNDERSTANDING_AND_SRS_CRITERIA.md` (architecture detail, interview Q&A, and SRS criteria mapping)
