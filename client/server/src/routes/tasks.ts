import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Small helper to wrap async handlers
const ah = (fn: any) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- Utils ---
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Compute next order in a status column
async function nextOrder(status: string) {
  const last = await prisma.task.findFirst({
    where: { status },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

// --- Routes ---
// List tasks with optional status / search / sort
router.get(
  "/",
  ah(async (req: Request, res: Response) => {
    const { status, search, sort = "createdAt", order = "desc" } = req.query as any;

    const where: any = {};
    if (status && status !== "all") where.status = String(status).toUpperCase();
    if (search) where.title = { contains: String(search), mode: "insensitive" };

    const validSort = ["createdAt", "dueDate", "priority", "order"] as const;
    const sortKey = validSort.includes(sort as any) ? (sort as any) : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { [sortKey]: sortOrder } as any, { id: "asc" }],
    });

    res.json({ ok: true, data: tasks });
  })
);

// Create a task
router.post(
  "/",
  ah(async (req: Request, res: Response) => {
    const {
      title,
      description,
      status = "TODO",
      priority = "Medium",
      assignee,
      label,
      dueDate,
      commentsCount = 0,
    } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ ok: false, error: "title is required" });
    }

    const ord = await nextOrder(String(status).toUpperCase());

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status: String(status).toUpperCase(),
        priority,
        assignee: assignee ?? null,
        label: label ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        commentsCount,
        order: ord,
      },
    });

    res.status(201).json({ ok: true, data: task });
  })
);

// Update a task (partial)
router.patch(
  "/:id",
  ah(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "invalid id" });

    const { title, description, status, priority, assignee, label, dueDate, commentsCount } =
      req.body || {};

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = String(status).toUpperCase();
    if (priority !== undefined) data.priority = priority;
    if (assignee !== undefined) data.assignee = assignee;
    if (label !== undefined) data.label = label;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (commentsCount !== undefined) data.commentsCount = Number(commentsCount) || 0;

    const updated = await prisma.task.update({ where: { id }, data });
    res.json({ ok: true, data: updated });
  })
);

// Delete a task
router.delete(
  "/:id",
  ah(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "invalid id" });

    await prisma.task.delete({ where: { id } });
    res.json({ ok: true });
  })
);

// Move/Reorder a task (drag & drop)
// Body: { toStatus?: string, toIndex: number }
router.patch(
  "/:id/move",
  ah(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "invalid id" });

    const { toStatus, toIndex } = req.body || {};
    if (toIndex === undefined || toIndex === null) {
      return res.status(400).json({ ok: false, error: "toIndex is required" });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ ok: false, error: "task not found" });

    const destStatus = (toStatus ? String(toStatus) : task.status).toUpperCase();

    // Count tasks in destination status to clamp index
    const destCount = await prisma.task.count({ where: { status: destStatus } });
    const newIndex = clamp(Number(toIndex), 0, Math.max(0, destCount - (task.status === destStatus ? 1 : 0)));

    const isSameColumn = task.status === destStatus;

    const tx = await prisma.$transaction(async (txClient) => {
      if (isSameColumn) {
        // Reorder within same status
        if (newIndex === task.order) return task;

        if (newIndex > task.order) {
          // shift up items between (task.order+1 .. newIndex) down by 1
          await txClient.task.updateMany({
            where: { status: destStatus, order: { gt: task.order, lte: newIndex } },
            data: { order: { decrement: 1 } },
          });
        } else {
          // shift down items between (newIndex .. task.order-1) up by 1
          await txClient.task.updateMany({
            where: { status: destStatus, order: { gte: newIndex, lt: task.order } },
            data: { order: { increment: 1 } },
          });
        }

        return txClient.task.update({ where: { id }, data: { order: newIndex } });
      } else {
        // Moving across columns
        // 1) close gap in source column
        await txClient.task.updateMany({
          where: { status: task.status, order: { gt: task.order } },
          data: { order: { decrement: 1 } },
        });

        // 2) open gap in destination column at newIndex
        await txClient.task.updateMany({
          where: { status: destStatus, order: { gte: newIndex } },
          data: { order: { increment: 1 } },
        });

        // 3) move task
        return txClient.task.update({
          where: { id },
          data: { status: destStatus, order: newIndex },
        });
      }
    });

    res.json({ ok: true, data: tx });
  })
);

export default router;

// For visibility in server logs when mounted
console.log(">> tasks router LOADED @", new Date().toISOString());
