

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding tasks...");

  const tasks = [
    {
      title: "Setup project structure",
      description: "Initialize folders and install dependencies",
      status: "TODO",
      priority: "High",
      assignee: "Ali",
      label: "Project",
      order: 0,
    },
    {
      title: "Design database schema",
      description: "Define models for requests and tasks",
      status: "IN_PROGRESS",
      priority: "Medium",
      assignee: "Sara",
      label: "Database",
      order: 0,
    },
    {
      title: "Build Requests API",
      description: "CRUD endpoints for requests",
      status: "COMPLETED",
      priority: "Low",
      assignee: "Omar",
      label: "Backend",
      order: 0,
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });