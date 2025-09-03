import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "https://ncs-client.vercel.app",
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow others in demo (relax CORS); tighten later if needed
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Ensure uploads dir exists and serve it statically
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}-${file.originalname}`)
});
const upload = multer({ storage });

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "NCS API", timestamp: new Date().toISOString() });
});

// === Requests Room ===
const StatusEnum = z.enum(["New","Under Review","Quotation","Approved"]);
const RequestSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  department: z.string().min(1),
  priority: z.enum(["Low","Medium","High"]),
  quantity: z.number().int().positive(),
  specs: z.string().optional().default("")
});

type Status = z.infer<typeof StatusEnum>;
type FileMeta = {
  id: string;
  name: string;
  size: number;
  url: string;       // /uploads/filename
  uploadedAt: string;
};
type RequestItem = z.infer<typeof RequestSchema> & {
  id: string;
  status: Status;
  createdAt: string;
  files: FileMeta[];
  completed: boolean;
};

const requests: RequestItem[] = [];

// List
app.get("/api/requests", (_req, res) => {
  res.json(requests);
});

// Create
app.post("/api/requests", (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const item: RequestItem = {
    ...parsed.data,
    id: randomUUID(),
    status: "New",
    createdAt: new Date().toISOString(),
    files: [],
    completed: false
  };
  requests.unshift(item);
  res.status(201).json(item);
});

// Update status
app.patch("/api/requests/:id/status", (req, res) => {
  const id = req.params.id;
  const parsed = StatusEnum.safeParse(req.body?.status);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  requests[idx].status = parsed.data;
  res.json(requests[idx]);
});

// Toggle completed
app.patch("/api/requests/:id/completed", (req, res) => {
  const id = req.params.id;
  const r = requests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  const value = typeof req.body?.completed === "boolean" ? req.body.completed : !r.completed;
  r.completed = value;
  res.json(r);
});

// === Vault (file upload) ===

// List files for a request
app.get("/api/requests/:id/files", (req, res) => {
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json(r.files ?? []);
});

// Upload file for a request
app.post("/api/requests/:id/files", upload.single("file"), (req, res) => {
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  if (!req.file) return res.status(400).json({ error: "No file" });

  const fm: FileMeta = {
    id: randomUUID(),
    name: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString()
  };
  r.files = r.files || [];
  r.files.push(fm);
  res.status(201).json(fm);
});

app.listen(PORT, () => {
  console.log(`✅ NCS API running on http://localhost:${PORT}`);
});
