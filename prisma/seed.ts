import { PrismaClient, RoleName, EmploymentStatus, LeaveRequestStatus, ApprovalDecision, AttendanceStatus, AnnouncementScope } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";

async function main() {
  await prisma.notification.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveApprovalStep.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.subsidiary.deleteMany();
  await prisma.country.deleteMany();
  await prisma.company.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.role.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const year = new Date().getFullYear();

  const roles = await Promise.all(
    (
      [
        [RoleName.SUPER_ADMIN, "Global HR / Super Admin"],
        [RoleName.HR_MANAGER, "Subsidiary HR Manager"],
        [RoleName.DEPARTMENT_HEAD, "Department Head"],
        [RoleName.TEAM_LEAD, "Team Lead / Line Manager"],
        [RoleName.EMPLOYEE, "Employee"],
        [RoleName.FINANCE, "Finance / Payroll Officer"],
      ] as const
    ).map(([name, description]) =>
      prisma.role.create({ data: { name, description } })
    )
  );

  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id])) as Record<
    RoleName,
    string
  >;

  const company = await prisma.company.create({
    data: {
      name: "Cellutech",
      legalName: "Cellutech Private Limited",
    },
  });

  const pakistan = await prisma.country.create({
    data: { name: "Pakistan", code: "PK" },
  });
  const uae = await prisma.country.create({
    data: { name: "United Arab Emirates", code: "AE" },
  });

  const karachi = await prisma.subsidiary.create({
    data: {
      name: "Karachi HQ",
      city: "Karachi",
      timezone: "Asia/Karachi",
      currency: "PKR",
      countryId: pakistan.id,
      companyId: company.id,
    },
  });
  const lahore = await prisma.subsidiary.create({
    data: {
      name: "Lahore Office",
      city: "Lahore",
      timezone: "Asia/Karachi",
      currency: "PKR",
      countryId: pakistan.id,
      companyId: company.id,
    },
  });
  const dubai = await prisma.subsidiary.create({
    data: {
      name: "Dubai Office",
      city: "Dubai",
      timezone: "Asia/Dubai",
      currency: "AED",
      countryId: uae.id,
      companyId: company.id,
    },
  });

  async function createDepts(subsidiaryId: string) {
    const names = ["Engineering", "Sales", "HR", "Finance"] as const;
    const depts: Record<string, { id: string; designations: Record<string, string> }> = {};
    for (const name of names) {
      const dept = await prisma.department.create({
        data: { name, subsidiaryId },
      });
      const titles =
        name === "Engineering"
          ? ["Software Engineer", "Engineering Manager", "Tech Lead"]
          : name === "Sales"
            ? ["Sales Executive", "Sales Manager"]
            : name === "HR"
              ? ["HR Officer", "HR Manager"]
              : ["Accountant", "Finance Manager"];
      const designations: Record<string, string> = {};
      for (const title of titles) {
        const d = await prisma.designation.create({
          data: { title, departmentId: dept.id },
        });
        designations[title] = d.id;
      }
      depts[name] = { id: dept.id, designations };
    }
    return depts;
  }

  const kDepts = await createDepts(karachi.id);
  const lDepts = await createDepts(lahore.id);
  const dDepts = await createDepts(dubai.id);

  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        name: "Annual Leave",
        code: "ANNUAL",
        defaultAnnualQuota: 14,
        requiresEscalation: false,
        escalationThresholdDays: 3,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Sick Leave",
        code: "SICK",
        defaultAnnualQuota: 10,
        requiresEscalation: false,
        escalationThresholdDays: 3,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Casual Leave",
        code: "CASUAL",
        defaultAnnualQuota: 8,
        requiresEscalation: false,
        escalationThresholdDays: 2,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Unpaid Leave",
        code: "UNPAID",
        defaultAnnualQuota: 30,
        requiresEscalation: true,
        escalationThresholdDays: 1,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Maternity / Paternity Leave",
        code: "PARENTAL",
        defaultAnnualQuota: 90,
        requiresEscalation: true,
        escalationThresholdDays: 1,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Bereavement Leave",
        code: "BEREAVEMENT",
        defaultAnnualQuota: 5,
        requiresEscalation: false,
        escalationThresholdDays: 5,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: "Work From Home",
        code: "WFH",
        defaultAnnualQuota: 24,
        requiresEscalation: false,
        escalationThresholdDays: 5,
      },
    }),
  ]);

  type UserSeed = {
    email: string;
    firstName: string;
    lastName: string;
    role: RoleName;
    subsidiaryId?: string;
    departmentId?: string;
    designationId?: string;
    managerId?: string;
    joiningDate: Date;
    phone?: string;
  };

  async function createUser(data: UserSeed) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        joiningDate: data.joiningDate,
        status: EmploymentStatus.ACTIVE,
        roleId: roleMap[data.role],
        subsidiaryId: data.subsidiaryId,
        departmentId: data.departmentId,
        designationId: data.designationId,
        managerId: data.managerId,
      },
    });
  }

  const admin = await createUser({
    email: "seher.siddique@hrms.pk",
    firstName: "Seher",
    lastName: "Siddique",
    role: RoleName.SUPER_ADMIN,
    joiningDate: new Date("2018-01-15"),
    phone: "+92-300-1110001",
  });

  const hrKarachi = await createUser({
    email: "hr.karachi@hrms.pk",
    firstName: "Fatima",
    lastName: "Ali",
    role: RoleName.HR_MANAGER,
    subsidiaryId: karachi.id,
    departmentId: kDepts.HR.id,
    designationId: kDepts.HR.designations["HR Manager"],
    joiningDate: new Date("2019-03-01"),
    phone: "+92-300-1110002",
  });

  const hrLahore = await createUser({
    email: "hr.lahore@hrms.pk",
    firstName: "Sana",
    lastName: "Qureshi",
    role: RoleName.HR_MANAGER,
    subsidiaryId: lahore.id,
    departmentId: lDepts.HR.id,
    designationId: lDepts.HR.designations["HR Manager"],
    joiningDate: new Date("2020-06-10"),
    phone: "+92-300-1110003",
  });

  const engHead = await createUser({
    email: "head.eng@hrms.pk",
    firstName: "Ahmed",
    lastName: "Khan",
    role: RoleName.DEPARTMENT_HEAD,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Engineering Manager"],
    managerId: hrKarachi.id,
    joiningDate: new Date("2019-08-20"),
    phone: "+92-300-1110004",
  });

  const salesHead = await createUser({
    email: "head.sales@hrms.pk",
    firstName: "Ayesha",
    lastName: "Malik",
    role: RoleName.DEPARTMENT_HEAD,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Sales.id,
    designationId: kDepts.Sales.designations["Sales Manager"],
    managerId: hrKarachi.id,
    joiningDate: new Date("2020-01-12"),
    phone: "+92-300-1110005",
  });

  const teamLead = await createUser({
    email: "lead.eng@hrms.pk",
    firstName: "Bilal",
    lastName: "Hussain",
    role: RoleName.TEAM_LEAD,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Tech Lead"],
    managerId: engHead.id,
    joiningDate: new Date("2021-02-15"),
    phone: "+92-300-1110006",
  });

  const emp1 = await createUser({
    email: "usman.raza@hrms.pk",
    firstName: "Usman",
    lastName: "Raza",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Software Engineer"],
    managerId: teamLead.id,
    joiningDate: new Date("2022-04-01"),
    phone: "+92-300-1110007",
  });

  const emp2 = await createUser({
    email: "sara.sheikh@hrms.pk",
    firstName: "Sara",
    lastName: "Sheikh",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Software Engineer"],
    managerId: teamLead.id,
    joiningDate: new Date("2022-09-15"),
    phone: "+92-300-1110008",
  });

  const emp3 = await createUser({
    email: "hamza.iqbal@hrms.pk",
    firstName: "Hamza",
    lastName: "Iqbal",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Sales.id,
    designationId: kDepts.Sales.designations["Sales Executive"],
    managerId: salesHead.id,
    joiningDate: new Date("2023-01-10"),
    phone: "+92-300-1110009",
  });

  const lahoreLead = await createUser({
    email: "lead.lahore@hrms.pk",
    firstName: "Zainab",
    lastName: "Hassan",
    role: RoleName.TEAM_LEAD,
    subsidiaryId: lahore.id,
    departmentId: lDepts.Engineering.id,
    designationId: lDepts.Engineering.designations["Tech Lead"],
    managerId: hrLahore.id,
    joiningDate: new Date("2021-07-01"),
    phone: "+92-300-1110010",
  });

  const lahoreEmp = await createUser({
    email: "omar.farooq@hrms.pk",
    firstName: "Omar",
    lastName: "Farooq",
    role: RoleName.EMPLOYEE,
    subsidiaryId: lahore.id,
    departmentId: lDepts.Engineering.id,
    designationId: lDepts.Engineering.designations["Software Engineer"],
    managerId: lahoreLead.id,
    joiningDate: new Date("2023-05-20"),
    phone: "+92-300-1110011",
  });

  const dubaiHr = await createUser({
    email: "hr.dubai@hrms.pk",
    firstName: "Maryam",
    lastName: "Abbas",
    role: RoleName.HR_MANAGER,
    subsidiaryId: dubai.id,
    departmentId: dDepts.HR.id,
    designationId: dDepts.HR.designations["HR Manager"],
    joiningDate: new Date("2021-11-01"),
    phone: "+971-50-1110012",
  });

  const dubaiEmp = await createUser({
    email: "ali.nawaz@hrms.pk",
    firstName: "Ali",
    lastName: "Nawaz",
    role: RoleName.EMPLOYEE,
    subsidiaryId: dubai.id,
    departmentId: dDepts.Engineering.id,
    designationId: dDepts.Engineering.designations["Software Engineer"],
    managerId: dubaiHr.id,
    joiningDate: new Date("2024-02-01"),
    phone: "+971-50-1110013",
  });

  const financeOfficer = await createUser({
    email: "finance.karachi@hrms.pk",
    firstName: "Nadia",
    lastName: "Rehman",
    role: RoleName.FINANCE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Finance.id,
    designationId: kDepts.Finance.designations["Finance Manager"],
    managerId: hrKarachi.id,
    joiningDate: new Date("2020-04-15"),
    phone: "+92-300-1110014",
  });

  const allEmployees = [
    hrKarachi,
    hrLahore,
    engHead,
    salesHead,
    teamLead,
    emp1,
    emp2,
    emp3,
    lahoreLead,
    lahoreEmp,
    dubaiHr,
    dubaiEmp,
    financeOfficer,
  ];

  for (const user of allEmployees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: lt.id,
          year,
          allotted: lt.defaultAnnualQuota,
          used: lt.code === "ANNUAL" ? 2 : 0,
        },
      });
    }
  }

  const annual = leaveTypes.find((l) => l.code === "ANNUAL")!;
  const sick = leaveTypes.find((l) => l.code === "SICK")!;

  const pendingReq = await prisma.leaveRequest.create({
    data: {
      userId: emp1.id,
      leaveTypeId: annual.id,
      startDate: new Date(`${year}-10-05`),
      endDate: new Date(`${year}-10-07`),
      totalDays: 3,
      reason: "Family wedding in Lahore",
      status: LeaveRequestStatus.PENDING,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: teamLead.id,
          level: 1,
          decision: ApprovalDecision.PENDING,
        },
      },
    },
  });

  const escalatedReq = await prisma.leaveRequest.create({
    data: {
      userId: emp2.id,
      leaveTypeId: annual.id,
      startDate: new Date(`${year}-11-10`),
      endDate: new Date(`${year}-11-17`),
      totalDays: 6,
      reason: "Extended annual vacation",
      status: LeaveRequestStatus.PENDING_L2,
      currentApprovalStep: 2,
      approvalSteps: {
        create: [
          {
            approverId: teamLead.id,
            level: 1,
            decision: ApprovalDecision.APPROVED,
            comment: "Team coverage arranged",
            decidedAt: new Date(),
          },
          {
            approverId: engHead.id,
            level: 2,
            decision: ApprovalDecision.PENDING,
          },
        ],
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: emp3.id,
      leaveTypeId: sick.id,
      startDate: new Date(`${year}-09-01`),
      endDate: new Date(`${year}-09-02`),
      totalDays: 2,
      reason: "Medical recovery",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: salesHead.id,
          level: 1,
          decision: ApprovalDecision.APPROVED,
          comment: "Approved",
          decidedAt: new Date(`${year}-08-28`),
        },
      },
    },
  });

  void pendingReq;
  void escalatedReq;

  const pkHolidays = [
    { name: "Pakistan Day", date: new Date(`${year}-03-23`) },
    { name: "Labour Day", date: new Date(`${year}-05-01`) },
    { name: "Independence Day", date: new Date(`${year}-08-14`) },
    { name: "Iqbal Day", date: new Date(`${year}-11-09`) },
    { name: "Quaid-e-Azam Day", date: new Date(`${year}-12-25`) },
  ];

  for (const sub of [karachi, lahore]) {
    for (const h of pkHolidays) {
      await prisma.holiday.create({
        data: { subsidiaryId: sub.id, name: h.name, date: h.date },
      });
    }
  }

  await prisma.holiday.create({
    data: {
      subsidiaryId: dubai.id,
      name: "UAE National Day",
      date: new Date(`${year}-12-02`),
    },
  });
  await prisma.holiday.create({
    data: {
      subsidiaryId: dubai.id,
      name: "New Year's Day",
      date: new Date(`${year}-01-01`),
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const user of [emp1, emp2, emp3, teamLead, engHead]) {
    await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        status: AttendanceStatus.PRESENT,
      },
    });
  }
  await prisma.attendance.create({
    data: {
      userId: emp3.id,
      date: new Date(`${year}-09-01`),
      status: AttendanceStatus.LEAVE,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Welcome to Cellutech HRMS",
      body: "Our multi-subsidiary HR platform is live. Please keep your profiles updated and submit leave requests through the portal.",
      scope: AnnouncementScope.GLOBAL,
      createdById: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Karachi Office - Friday schedule",
      body: "Karachi HQ will operate half-day this Friday for facility maintenance.",
      scope: AnnouncementScope.SUBSIDIARY,
      subsidiaryId: karachi.id,
      createdById: hrKarachi.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: teamLead.id,
      title: "Leave approval needed",
      message: "Usman Raza requested 3 days of Annual Leave.",
      link: "/leave/approvals",
    },
  });

  await prisma.notification.create({
    data: {
      userId: engHead.id,
      title: "Escalated leave approval",
      message: "Sara Sheikh's 6-day Annual Leave needs Level-2 approval.",
      link: "/leave/approvals",
    },
  });

  await prisma.notification.create({
    data: {
      userId: emp3.id,
      title: "Leave approved",
      message: "Your sick leave request has been approved.",
      link: "/leave/my-requests",
      isRead: true,
    },
  });

  console.log("Seed completed successfully.");
  console.log("Demo password for all users:", PASSWORD);
  console.log("Key logins:");
  console.log("  Super Admin: seher.siddique@hrms.pk");
  console.log("  HR Manager:  hr.karachi@hrms.pk");
  console.log("  Dept Head:   head.eng@hrms.pk");
  console.log("  Team Lead:   lead.eng@hrms.pk");
  console.log("  Employee:    usman.raza@hrms.pk");
  console.log("  Finance:     finance.karachi@hrms.pk");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
