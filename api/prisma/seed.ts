import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Job, User } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const categories = ["Development", "Design", "Writing", "Marketing", "Data", "Video & Animation", "Business", "Customer Support", "Translation", "Engineering"];
const skills = ["React", "Node.js", "TypeScript", "Python", "SQLite", "UI Design", "Figma", "Illustration", "Copywriting", "SEO", "Social Media", "Data Analysis", "Excel", "Video Editing", "Motion Graphics", "Customer Support", "Burmese", "English", "Prisma", "Express"];
const firstNames = ["Aye", "Nandar", "Thura", "May", "Ko", "Htet", "Su", "Min", "Ei", "Zaw", "Mya", "Lin", "Khin", "Nay", "Yadanar", "Kyaw", "Thet", "Phyu", "Sai", "Wai"];
const lastNames = ["Aung", "Win", "Hlaing", "Oo", "Tun", "Myo", "Soe", "Naing", "Lwin", "Htet", "Khaing", "Kyaw", "Thein", "Maung", "Phyo"];
const jobTitles = ["Build a responsive company website", "Design a clean mobile app interface", "Write product pages for a new launch", "Set up a social media content calendar", "Create a data dashboard for sales", "Edit short videos for social channels", "Improve our online store checkout", "Translate onboarding content to Burmese", "Build an internal booking tool", "Refresh our brand illustration system"];
const jobDescriptions = [
  "We are looking for an experienced freelancer to help us deliver a polished first release. Please describe your relevant experience, approach, and availability in your proposal. We value clear communication and practical handoff notes.",
  "Our small team needs help with a focused project and has a clear goal, but we welcome your recommendations on the best way to reach it. Please share examples of related work and a realistic timeline.",
  "We need a reliable partner who can work with our existing materials, ask questions early, and deliver a high quality result. The scope can be refined together after we review proposals.",
];

async function main() {
  const sharedPassword = "ArcherDemo2026!";
  const passwordHash = await bcrypt.hash(sharedPassword, 10);
  await prisma.$transaction([
    prisma.projectMessage.deleteMany(), prisma.notification.deleteMany(), prisma.review.deleteMany(),
    prisma.report.deleteMany(), prisma.adminAuditEvent.deleteMany(), prisma.project.deleteMany(),
    prisma.proposal.deleteMany(), prisma.savedJob.deleteMany(), prisma.jobSkill.deleteMany(),
    prisma.freelancerSkill.deleteMany(), prisma.portfolioLink.deleteMany(), prisma.job.deleteMany(),
    prisma.category.deleteMany(), prisma.skill.deleteMany(), prisma.clientProfile.deleteMany(),
    prisma.freelancerProfile.deleteMany(), prisma.user.deleteMany(),
  ]);

  const skillRows = await Promise.all(skills.map((name) => prisma.skill.create({ data: { name } })));
  const categoryRows = await Promise.all(categories.map((name) => prisma.category.create({ data: { name } })));
  const users: User[] = [];
  for (let i = 0; i < 60; i++) {
    const admin = i < 2;
    const freelancer = (i >= 2 && i < 40) || i >= 55;
    const client = (i >= 40 && i < 55) || i >= 55;
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 7) % lastNames.length]}`;
    const user = await prisma.user.create({
      data: {
        name, email: admin ? `admin${i + 1}@archer.local` : `member${i + 1}@archer.local`, passwordHash, isAdmin: admin,
        ...(freelancer ? { freelancerProfile: { create: {
          headline: ["Full-stack developer", "Product designer", "Content specialist", "Data analyst"][i % 4],
          bio: `Freelancer ${i + 1} based in Myanmar. I focus on thoughtful, reliable work and clear communication.`,
          location: ["Yangon", "Mandalay", "Naypyidaw", "Remote"][i % 4], timeZone: "Asia/Yangon",
          hourlyRateMinor: i % 2 ? 2500 + i * 100 : 150000 + i * 1000, rateCurrency: i % 2 ? "USD" : "MMK",
          skills: { create: [{ skillId: skillRows[i % skillRows.length]!.id }, { skillId: skillRows[(i + 3) % skillRows.length]!.id }, { skillId: skillRows[(i + 7) % skillRows.length]!.id }] },
          portfolioLinks: { create: [{ label: "Portfolio", url: `https://example.com/portfolio/${i + 1}` }] },
        } } } : {}),
        ...(client ? { clientProfile: { create: { displayName: `${name} Studio`, description: `A sample client organization for Archer demo data.`, location: ["Yangon", "Mandalay", "Remote"][i % 3] } } } : {}),
      },
    });
    users.push(user);
  }
  const clientUsers = users.slice(40);
  const freelancerUsers = [...users.slice(2, 40), ...users.slice(55)];
  const jobs: Job[] = [];
  const jobStatuses = ["open", "open", "open", "paused", "draft", "closed"];
  for (let i = 0; i < 100; i++) {
    const currency = i % 2 ? "USD" : "MMK";
    const job = await prisma.job.create({
      data: {
        clientId: clientUsers[i % clientUsers.length]!.id,
        categoryId: categoryRows[i % categoryRows.length]!.id,
        title: `${jobTitles[i % jobTitles.length]} ${i + 1}`,
        description: jobDescriptions[i % jobDescriptions.length]!,
        budgetType: i % 3 === 0 ? "hourly" : "fixed",
        minAmountMinor: currency === "USD" ? 15000 + i * 100 : 250000 + i * 1000,
        maxAmountMinor: currency === "USD" ? 80000 + i * 200 : 1500000 + i * 2000,
        currency, experienceLevel: ["entry", "intermediate", "expert"][i % 3]!, status: i < 30 ? "closed" : jobStatuses[i % jobStatuses.length]!,
        skills: { create: [{ skillId: skillRows[i % skillRows.length]!.id }, { skillId: skillRows[(i + 5) % skillRows.length]!.id }] },
      },
    });
    jobs.push(job);
  }
  const proposalByJob = new Map<string, string>();
  const proposalStatuses = ["pending", "shortlisted", "rejected", "pending", "withdrawn"];
  for (let i = 0; i < 150; i++) {
    const jobIndex = i % 100;
    const job = jobs[jobIndex]!;
    const freelancer = freelancerUsers[(i * 7 + Math.floor(i / 5)) % freelancerUsers.length]!;
    const hired = jobIndex < 30 && i < 30;
    const proposal = await prisma.proposal.create({
      data: {
        jobId: job.id, freelancerId: freelancer.id,
        coverMessage: `Hello, I would be glad to help with this project. My experience is relevant to the requested work, and I can share examples and agree on milestones after we discuss the scope. Sample proposal ${i + 1}.`,
        amountMinor: job.currency === "USD" ? 45000 + i * 100 : 800000 + i * 1000, currency: job.currency,
        estimatedDurationDays: 7 + (i % 30), status: hired ? "hired" : proposalStatuses[i % proposalStatuses.length]!,
      },
    });
    if (!proposalByJob.has(job.id)) proposalByJob.set(job.id, proposal.id);
    if (hired) {
      const project = await prisma.project.create({
        data: {
          jobId: job.id, proposalId: proposal.id, clientId: job.clientId, freelancerId: freelancer.id,
          scopeSummary: job.description, amountMinor: proposal.amountMinor, currency: proposal.currency,
          status: jobIndex < 20 ? "completed" : "active",
        },
      });
      await prisma.projectMessage.createMany({ data: [
        { projectId: project.id, senderId: job.clientId, body: "Welcome! I have added the project brief here." },
        { projectId: project.id, senderId: freelancer.id, body: "Thanks, I have reviewed the brief and will share an update soon." },
      ] });
      if (jobIndex < 20) await prisma.review.create({ data: { projectId: project.id, authorId: job.clientId, recipientId: freelancer.id, rating: 4 + (jobIndex % 2), body: "Clear communication and a strong result. Sample review." } });
    }
  }
  for (let i = 0; i < 30; i++) {
    await prisma.savedJob.create({ data: { userId: freelancerUsers[i % freelancerUsers.length]!.id, jobId: jobs[30 + i]!.id } });
  }
  const sampleProposals = await prisma.proposal.findMany({
    where: { status: { not: "withdrawn" } },
    include: { freelancer: { select: { name: true } }, job: { select: { id: true, title: true, clientId: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const proposalNotifications = sampleProposals.map((proposal) => ({
    userId: proposal.job.clientId,
    type: "proposal_received",
    message: `${proposal.freelancer.name} submitted a proposal for “${proposal.job.title}”.`,
    href: `/jobs/${proposal.job.id}/proposals`,
  }));
  const sampleProjects = await prisma.project.findMany({
    include: { job: { select: { title: true } }, client: { select: { name: true } }, freelancer: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  const projectNotifications = sampleProjects.flatMap((project) => [
    { userId: project.clientId, type: "project_created", message: `Your project for “${project.job.title}” is ready with ${project.freelancer.name}.`, href: `/projects/${project.id}` },
    { userId: project.freelancerId, type: "hired", message: `${project.client.name} hired you for “${project.job.title}”.`, href: `/projects/${project.id}` },
  ]);
  await prisma.notification.createMany({ data: [...proposalNotifications, ...projectNotifications] });
  await prisma.report.createMany({ data: Array.from({ length: 12 }, (_, i) => ({ reporterId: users[2 + (i % 38)]!.id, targetType: "job", targetId: jobs[40 + i]!.id, reason: ["spam", "inappropriate content", "misleading details"][i % 3]!, details: "Sample report for demonstrating the admin moderation queue." })) });

  console.log(`Seeded ${users.length} users, ${jobs.length} jobs, 150 proposals, 30 projects, 60 notifications, and 12 reports.`);
  console.log(`Local demo sign-in password: ${sharedPassword}`);
  console.log("Sample users: admin1@archer.local, member3@archer.local, member41@archer.local");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
