import fs from "fs";
import path from "path";
import {
  PrismaClient,
  RoleName,
  EmploymentStatus,
  LeaveRequestStatus,
  ApprovalDecision,
  AttendanceStatus,
  AnnouncementScope,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";

function atMidnight(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromToday(offset: number) {
  const d = atMidnight(new Date());
  d.setDate(d.getDate() + offset);
  return d;
}

function withTime(base: Date, hours: number, minutes: number) {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.policyDocument.deleteMany();
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
          ? ["Software Engineer", "Engineering Manager", "Tech Lead", "QA Engineer"]
          : name === "Sales"
            ? ["Sales Executive", "Sales Manager", "Account Executive"]
            : name === "HR"
              ? ["HR Officer", "HR Manager"]
              : ["Accountant", "Finance Manager", "Payroll Officer"];
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
    status?: EmploymentStatus;
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
        status: data.status ?? EmploymentStatus.ACTIVE,
        roleId: roleMap[data.role],
        subsidiaryId: data.subsidiaryId,
        departmentId: data.departmentId,
        designationId: data.designationId,
        managerId: data.managerId,
      },
    });
  }

  const admin = await createUser({
    email: "seher.siddique@cellutechfzco.com",
    firstName: "Seher",
    lastName: "Siddique",
    role: RoleName.SUPER_ADMIN,
    joiningDate: new Date("2018-01-15"),
    phone: "+92-300-1110001",
  });

  const hrKarachi = await createUser({
    email: "hr.karachi@cellutechfzco.com",
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
    email: "hr.lahore@cellutechfzco.com",
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
    email: "head.eng@cellutechfzco.com",
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
    email: "head.sales@cellutechfzco.com",
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
    email: "lead.eng@cellutechfzco.com",
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
    email: "usman.raza@cellutechfzco.com",
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
    email: "sara.sheikh@cellutechfzco.com",
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
    email: "hamza.iqbal@cellutechfzco.com",
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

  const engQa = await createUser({
    email: "mehwish.tariq@cellutechfzco.com",
    firstName: "Mehwish",
    lastName: "Tariq",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["QA Engineer"],
    managerId: teamLead.id,
    joiningDate: new Date("2023-03-12"),
    phone: "+92-300-1110015",
  });

  const engJunior = await createUser({
    email: "danish.akhtar@cellutechfzco.com",
    firstName: "Danish",
    lastName: "Akhtar",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Software Engineer"],
    managerId: teamLead.id,
    joiningDate: new Date("2024-01-08"),
    phone: "+92-300-1110016",
  });

  const salesExec2 = await createUser({
    email: "noor.fatima@cellutechfzco.com",
    firstName: "Noor",
    lastName: "Fatima",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Sales.id,
    designationId: kDepts.Sales.designations["Account Executive"],
    managerId: salesHead.id,
    joiningDate: new Date("2023-08-21"),
    phone: "+92-300-1110017",
  });

  const hrOfficer = await createUser({
    email: "rabia.naveed@cellutechfzco.com",
    firstName: "Rabia",
    lastName: "Naveed",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.HR.id,
    designationId: kDepts.HR.designations["HR Officer"],
    managerId: hrKarachi.id,
    joiningDate: new Date("2022-11-01"),
    phone: "+92-300-1110018",
  });

  const financeOfficer = await createUser({
    email: "finance.karachi@cellutechfzco.com",
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

  const accountant = await createUser({
    email: "imran.shaikh@cellutechfzco.com",
    firstName: "Imran",
    lastName: "Shaikh",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Finance.id,
    designationId: kDepts.Finance.designations["Accountant"],
    managerId: financeOfficer.id,
    joiningDate: new Date("2021-09-05"),
    phone: "+92-300-1110019",
  });

  const onLeaveEmp = await createUser({
    email: "hira.javed@cellutechfzco.com",
    firstName: "Hira",
    lastName: "Javed",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Engineering.id,
    designationId: kDepts.Engineering.designations["Software Engineer"],
    managerId: teamLead.id,
    joiningDate: new Date("2021-05-18"),
    phone: "+92-300-1110020",
    status: EmploymentStatus.ON_LEAVE,
  });

  const formerEmp = await createUser({
    email: "kamran.butt@cellutechfzco.com",
    firstName: "Kamran",
    lastName: "Butt",
    role: RoleName.EMPLOYEE,
    subsidiaryId: karachi.id,
    departmentId: kDepts.Sales.id,
    designationId: kDepts.Sales.designations["Sales Executive"],
    managerId: salesHead.id,
    joiningDate: new Date("2020-02-10"),
    phone: "+92-300-1110021",
    status: EmploymentStatus.TERMINATED,
  });

  const lahoreLead = await createUser({
    email: "lead.lahore@cellutechfzco.com",
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
    email: "omar.farooq@cellutechfzco.com",
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

  const lahoreEmp2 = await createUser({
    email: "aiza.khan@cellutechfzco.com",
    firstName: "Aiza",
    lastName: "Khan",
    role: RoleName.EMPLOYEE,
    subsidiaryId: lahore.id,
    departmentId: lDepts.Engineering.id,
    designationId: lDepts.Engineering.designations["QA Engineer"],
    managerId: lahoreLead.id,
    joiningDate: new Date("2024-03-04"),
    phone: "+92-300-1110022",
  });

  const lahoreSalesHead = await createUser({
    email: "head.sales.lahore@cellutechfzco.com",
    firstName: "Tariq",
    lastName: "Mehmood",
    role: RoleName.DEPARTMENT_HEAD,
    subsidiaryId: lahore.id,
    departmentId: lDepts.Sales.id,
    designationId: lDepts.Sales.designations["Sales Manager"],
    managerId: hrLahore.id,
    joiningDate: new Date("2020-10-15"),
    phone: "+92-300-1110023",
  });

  const lahoreSales = await createUser({
    email: "saad.ansari@cellutechfzco.com",
    firstName: "Saad",
    lastName: "Ansari",
    role: RoleName.EMPLOYEE,
    subsidiaryId: lahore.id,
    departmentId: lDepts.Sales.id,
    designationId: lDepts.Sales.designations["Sales Executive"],
    managerId: lahoreSalesHead.id,
    joiningDate: new Date("2023-12-01"),
    phone: "+92-300-1110024",
  });

  const dubaiHr = await createUser({
    email: "hr.dubai@cellutechfzco.com",
    firstName: "Maryam",
    lastName: "Abbas",
    role: RoleName.HR_MANAGER,
    subsidiaryId: dubai.id,
    departmentId: dDepts.HR.id,
    designationId: dDepts.HR.designations["HR Manager"],
    joiningDate: new Date("2021-11-01"),
    phone: "+971-50-1110012",
  });

  const dubaiLead = await createUser({
    email: "lead.dubai@cellutechfzco.com",
    firstName: "Yasir",
    lastName: "Siddiqui",
    role: RoleName.TEAM_LEAD,
    subsidiaryId: dubai.id,
    departmentId: dDepts.Engineering.id,
    designationId: dDepts.Engineering.designations["Tech Lead"],
    managerId: dubaiHr.id,
    joiningDate: new Date("2022-06-20"),
    phone: "+971-50-1110025",
  });

  const dubaiEmp = await createUser({
    email: "ali.nawaz@cellutechfzco.com",
    firstName: "Ali",
    lastName: "Nawaz",
    role: RoleName.EMPLOYEE,
    subsidiaryId: dubai.id,
    departmentId: dDepts.Engineering.id,
    designationId: dDepts.Engineering.designations["Software Engineer"],
    managerId: dubaiLead.id,
    joiningDate: new Date("2024-02-01"),
    phone: "+971-50-1110013",
  });

  const dubaiEmp2 = await createUser({
    email: "lina.hassan@cellutechfzco.com",
    firstName: "Lina",
    lastName: "Hassan",
    role: RoleName.EMPLOYEE,
    subsidiaryId: dubai.id,
    departmentId: dDepts.Engineering.id,
    designationId: dDepts.Engineering.designations["Software Engineer"],
    managerId: dubaiLead.id,
    joiningDate: new Date("2023-07-17"),
    phone: "+971-50-1110026",
  });

  const dubaiSales = await createUser({
    email: "faisal.omar@cellutechfzco.com",
    firstName: "Faisal",
    lastName: "Omar",
    role: RoleName.EMPLOYEE,
    subsidiaryId: dubai.id,
    departmentId: dDepts.Sales.id,
    designationId: dDepts.Sales.designations["Sales Executive"],
    managerId: dubaiHr.id,
    joiningDate: new Date("2022-12-05"),
    phone: "+971-50-1110027",
  });

  const allEmployees = [
    admin,
    hrKarachi,
    hrLahore,
    engHead,
    salesHead,
    teamLead,
    emp1,
    emp2,
    emp3,
    engQa,
    engJunior,
    salesExec2,
    hrOfficer,
    financeOfficer,
    accountant,
    onLeaveEmp,
    lahoreLead,
    lahoreEmp,
    lahoreEmp2,
    lahoreSalesHead,
    lahoreSales,
    dubaiHr,
    dubaiLead,
    dubaiEmp,
    dubaiEmp2,
    dubaiSales,
  ];

  for (const user of allEmployees) {
    for (const lt of leaveTypes) {
      const used =
        lt.code === "ANNUAL"
          ? user.id === emp1.id
            ? 5
            : user.id === emp2.id
              ? 4
              : user.id === onLeaveEmp.id
                ? 8
                : 2
          : lt.code === "SICK"
            ? user.id === emp3.id
              ? 2
              : 0
            : lt.code === "CASUAL"
              ? user.id === engQa.id
                ? 1
                : 0
              : 0;

      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: lt.id,
          year,
          allotted: lt.defaultAnnualQuota,
          used,
        },
      });
    }
  }

  const annual = leaveTypes.find((l) => l.code === "ANNUAL")!;
  const sick = leaveTypes.find((l) => l.code === "SICK")!;
  const casual = leaveTypes.find((l) => l.code === "CASUAL")!;
  const wfh = leaveTypes.find((l) => l.code === "WFH")!;

  await prisma.leaveRequest.create({
    data: {
      userId: emp1.id,
      leaveTypeId: annual.id,
      startDate: daysFromToday(10),
      endDate: daysFromToday(12),
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

  await prisma.leaveRequest.create({
    data: {
      userId: emp2.id,
      leaveTypeId: annual.id,
      startDate: daysFromToday(18),
      endDate: daysFromToday(25),
      totalDays: 6,
      reason: "Extended annual vacation with family",
      status: LeaveRequestStatus.PENDING_L2,
      currentApprovalStep: 2,
      approvalSteps: {
        create: [
          {
            approverId: teamLead.id,
            level: 1,
            decision: ApprovalDecision.APPROVED,
            comment: "Team coverage arranged with Danish",
            decidedAt: daysFromToday(-1),
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
      startDate: daysFromToday(-12),
      endDate: daysFromToday(-11),
      totalDays: 2,
      reason: "Medical recovery after fever",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: salesHead.id,
          level: 1,
          decision: ApprovalDecision.APPROVED,
          comment: "Get well soon",
          decidedAt: daysFromToday(-14),
        },
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: engQa.id,
      leaveTypeId: casual.id,
      startDate: daysFromToday(3),
      endDate: daysFromToday(3),
      totalDays: 1,
      reason: "Personal errand at NADRA office",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: teamLead.id,
          level: 1,
          decision: ApprovalDecision.APPROVED,
          comment: "Approved",
          decidedAt: daysFromToday(-2),
        },
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: engJunior.id,
      leaveTypeId: annual.id,
      startDate: daysFromToday(2),
      endDate: daysFromToday(4),
      totalDays: 3,
      reason: "Travel to Islamabad for family event",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: teamLead.id,
          level: 1,
          decision: ApprovalDecision.APPROVED,
          comment: "Coverage confirmed",
          decidedAt: daysFromToday(-3),
        },
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: onLeaveEmp.id,
      leaveTypeId: annual.id,
      startDate: daysFromToday(-3),
      endDate: daysFromToday(4),
      totalDays: 6,
      reason: "Pre-approved annual leave block",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 2,
      approvalSteps: {
        create: [
          {
            approverId: teamLead.id,
            level: 1,
            decision: ApprovalDecision.APPROVED,
            decidedAt: daysFromToday(-10),
          },
          {
            approverId: engHead.id,
            level: 2,
            decision: ApprovalDecision.APPROVED,
            comment: "Approved at department level",
            decidedAt: daysFromToday(-9),
          },
        ],
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: lahoreEmp.id,
      leaveTypeId: wfh.id,
      startDate: daysFromToday(1),
      endDate: daysFromToday(1),
      totalDays: 1,
      reason: "Home internet installation appointment",
      status: LeaveRequestStatus.PENDING,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: lahoreLead.id,
          level: 1,
          decision: ApprovalDecision.PENDING,
        },
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: dubaiEmp.id,
      leaveTypeId: annual.id,
      startDate: daysFromToday(7),
      endDate: daysFromToday(9),
      totalDays: 3,
      reason: "Visit family in Pakistan",
      status: LeaveRequestStatus.APPROVED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: dubaiLead.id,
          level: 1,
          decision: ApprovalDecision.APPROVED,
          decidedAt: daysFromToday(-4),
        },
      },
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: salesExec2.id,
      leaveTypeId: casual.id,
      startDate: daysFromToday(-20),
      endDate: daysFromToday(-20),
      totalDays: 1,
      reason: "Same-day personal leave",
      status: LeaveRequestStatus.REJECTED,
      currentApprovalStep: 1,
      approvalSteps: {
        create: {
          approverId: salesHead.id,
          level: 1,
          decision: ApprovalDecision.REJECTED,
          comment: "Client visit already scheduled that day",
          decidedAt: daysFromToday(-21),
        },
      },
    },
  });

  const pkHolidays = [
    { name: "Pakistan Day", date: new Date(`${year}-03-23`) },
    { name: "Labour Day", date: new Date(`${year}-05-01`) },
    { name: "Eid-ul-Fitr (observed)", date: new Date(`${year}-03-31`) },
    { name: "Eid-ul-Adha (observed)", date: new Date(`${year}-06-07`) },
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

  for (const h of [
    { name: "New Year's Day", date: new Date(`${year}-01-01`) },
    { name: "Eid-ul-Fitr (UAE)", date: new Date(`${year}-03-31`) },
    { name: "Arafat Day", date: new Date(`${year}-06-05`) },
    { name: "UAE National Day", date: new Date(`${year}-12-02`) },
  ]) {
    await prisma.holiday.create({
      data: { subsidiaryId: dubai.id, name: h.name, date: h.date },
    });
  }

  const attendanceUsers = [
    emp1,
    emp2,
    engQa,
    engJunior,
    teamLead,
    engHead,
    salesHead,
    emp3,
    salesExec2,
    financeOfficer,
    accountant,
    hrOfficer,
    lahoreLead,
    lahoreEmp,
    lahoreEmp2,
    dubaiLead,
    dubaiEmp,
    dubaiEmp2,
  ];

  for (let offset = 0; offset < 12; offset++) {
    const day = daysFromToday(-offset);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;

    for (const user of attendanceUsers) {
      if (user.id === onLeaveEmp.id) continue;
      if (user.id === emp3.id && (offset === 11 || offset === 12)) {
        continue;
      }

      const remote = user.id === dubaiEmp2.id && offset % 4 === 0;
      const status = remote ? AttendanceStatus.REMOTE : AttendanceStatus.PRESENT;
      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: day,
          status,
          checkInAt: withTime(day, 9, 5 + (offset % 20)),
          checkOutAt: offset === 0 ? null : withTime(day, 18, 10 + (offset % 25)),
          note: remote ? "Remote day" : null,
        },
      });
    }
  }

  for (const day of [daysFromToday(-12), daysFromToday(-11)]) {
    await prisma.attendance.create({
      data: {
        userId: emp3.id,
        date: day,
        status: AttendanceStatus.LEAVE,
        note: "Sick leave",
      },
    });
  }

  await prisma.attendance.create({
    data: {
      userId: onLeaveEmp.id,
      date: daysFromToday(0),
      status: AttendanceStatus.LEAVE,
      note: "On approved annual leave",
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Welcome to Cellutech HRMS",
      body: "Please keep your profile details current and submit leave through this portal. For policy documents, open the Policies section.",
      scope: AnnouncementScope.GLOBAL,
      createdById: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Karachi HQ - parking level update",
      body: "Basement parking on Level B2 is closed for waterproofing until Friday. Use visitor parking with your staff card.",
      scope: AnnouncementScope.SUBSIDIARY,
      subsidiaryId: karachi.id,
      createdById: hrKarachi.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Lahore Office - Ramadan working hours",
      body: "During Ramadan, Lahore office hours are 9:00 to 15:30. Please adjust client meetings accordingly.",
      scope: AnnouncementScope.SUBSIDIARY,
      subsidiaryId: lahore.id,
      createdById: hrLahore.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Dubai Office - visa document refresh",
      body: "Please upload an updated passport copy to your employee profile before month end.",
      scope: AnnouncementScope.SUBSIDIARY,
      subsidiaryId: dubai.id,
      createdById: dubaiHr.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: teamLead.id,
        title: "Leave approval needed",
        message: "Usman Raza requested 3 days of Annual Leave.",
        link: "/leave/approvals",
      },
      {
        userId: engHead.id,
        title: "Escalated leave approval",
        message: "Sara Sheikh's 6-day Annual Leave needs Level-2 approval.",
        link: "/leave/approvals",
      },
      {
        userId: emp3.id,
        title: "Leave approved",
        message: "Your sick leave request has been approved.",
        link: "/leave/my-requests",
        isRead: true,
      },
      {
        userId: lahoreLead.id,
        title: "Leave approval needed",
        message: "Omar Farooq requested Work From Home for tomorrow.",
        link: "/leave/approvals",
      },
      {
        userId: emp1.id,
        title: "Reminder",
        message: "Your pending leave request is waiting for manager review.",
        link: "/leave/my-requests",
      },
      {
        userId: salesExec2.id,
        title: "Leave rejected",
        message: "Your casual leave request was rejected. See comments in My Leave.",
        link: "/leave/my-requests",
        isRead: true,
      },
      {
        userId: hrKarachi.id,
        title: "Headcount note",
        message: "One Karachi employee is currently marked On Leave. Review attendance if needed.",
        link: "/attendance",
      },
    ],
  });

  const policyDir = path.join(process.cwd(), "uploads", "policies");
  fs.mkdirSync(policyDir, { recursive: true });

  const policies = [
    {
      title: "Employee Code of Conduct",
      category: "HR Policy",
      description: "Expected workplace behaviour and ethics for all Cellutech staff.",
      fileName: "code-of-conduct.txt",
      scope: AnnouncementScope.GLOBAL,
      subsidiaryId: null as string | null,
      body: "Cellutech Employee Code of Conduct\n\nTreat colleagues with respect, protect confidential information, and follow local labour laws in each subsidiary.",
    },
    {
      title: "Leave and Attendance Policy",
      category: "Leave",
      description: "How leave balances, approvals, and attendance punches are handled.",
      fileName: "leave-attendance-policy.txt",
      scope: AnnouncementScope.GLOBAL,
      subsidiaryId: null,
      body: "Leave requests must be submitted in HRMS. Managers approve Level 1. Escalated leave requires Department Head approval.",
    },
    {
      title: "Karachi Office Safety Guidelines",
      category: "Facilities",
      description: "Building access, fire exits, and visitor process for Karachi HQ.",
      fileName: "karachi-safety.txt",
      scope: AnnouncementScope.SUBSIDIARY,
      subsidiaryId: karachi.id,
      body: "Karachi HQ Safety Guidelines\n\nAlways wear your staff badge. Report incidents to Facilities and HR on the same day.",
    },
  ];

  for (const policy of policies) {
    const storagePath = path.join(policyDir, `${Date.now()}-${policy.fileName}`);
    fs.writeFileSync(storagePath, policy.body, "utf8");
    await prisma.policyDocument.create({
      data: {
        title: policy.title,
        category: policy.category,
        description: policy.description,
        fileName: policy.fileName,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(policy.body),
        storagePath,
        scope: policy.scope,
        subsidiaryId: policy.subsidiaryId,
        uploadedById: policy.subsidiaryId === karachi.id ? hrKarachi.id : admin.id,
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log("Demo password for all users:", PASSWORD);
  console.log("Active employees seeded:", allEmployees.length);
  console.log("Key logins:");
  console.log("  Super Admin: seher.siddique@cellutechfzco.com");
  console.log("  HR Manager:  hr.karachi@cellutechfzco.com");
  console.log("  Dept Head:   head.eng@cellutechfzco.com");
  console.log("  Team Lead:   lead.eng@cellutechfzco.com");
  console.log("  Employee:    usman.raza@cellutechfzco.com");
  console.log("  Finance:     finance.karachi@cellutechfzco.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
