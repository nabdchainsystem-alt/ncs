import { promises as fs } from 'fs';
import path from 'path';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const storesFile = path.join(process.cwd(), 'tmp', 'stores.json');

type StoreRecord = {
  id: number;
  code: string;
  name: string;
  location: string | null;
  description: string | null;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
};

async function ensureFile(): Promise<void> {
  try {
    await fs.access(storesFile);
  } catch {
    await fs.mkdir(path.dirname(storesFile), { recursive: true });
    await fs.writeFile(storesFile, '[]', 'utf8');
  }
}

async function readStores(): Promise<StoreRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(storesFile, 'utf8');
  try {
    const parsed = JSON.parse(raw) as StoreRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStores(stores: StoreRecord[]): Promise<void> {
  await fs.writeFile(storesFile, JSON.stringify(stores, null, 2), 'utf8');
}

const createStoreSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

const updateStoreSchema = createStoreSchema.partial();

const mapResponse = (store: StoreRecord) => ({
  id: store.id,
  code: store.code,
  name: store.name,
  location: store.location,
  description: store.description,
  capacity: store.capacity,
  createdAt: store.createdAt,
  updatedAt: store.updatedAt,
  warehouseCount: 0,
  inventoryCount: 0,
  warehouses: [],
});

router.get('/', async (_req, res) => {
  const stores = await readStores();
  res.json(stores.map(mapResponse));
});

router.post('/', async (req, res) => {
  const payload = createStoreSchema.safeParse(req.body ?? {});
  if (!payload.success) {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }

  const stores = await readStores();
  const duplicate = stores.find((store) => store.code.toLowerCase() === payload.data.code.trim().toLowerCase());
  if (duplicate) {
    res.status(409).json({ error: 'store_code_duplicate' });
    return;
  }

  const now = new Date().toISOString();
  const record: StoreRecord = {
    id: stores.length ? Math.max(...stores.map((store) => store.id)) + 1 : 1,
    code: payload.data.code.trim(),
    name: payload.data.name.trim(),
    location: payload.data.location?.trim() || null,
    description: payload.data.description?.trim() || null,
    capacity: payload.data.capacity ?? null,
    createdAt: now,
    updatedAt: now,
  };

  stores.push(record);
  await writeStores(stores);
  res.status(201).json(mapResponse(record));
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid_store_id' });
    return;
  }

  const payload = updateStoreSchema.safeParse(req.body ?? {});
  if (!payload.success) {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }

  const stores = await readStores();
  const index = stores.findIndex((store) => store.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'store_not_found' });
    return;
  }

  if (payload.data.code) {
    const duplicate = stores.find(
      (store) => store.id !== id && store.code.toLowerCase() === payload.data.code!.trim().toLowerCase(),
    );
    if (duplicate) {
      res.status(409).json({ error: 'store_code_duplicate' });
      return;
    }
  }

  const current = stores[index];
  const updated: StoreRecord = {
    ...current,
    code: payload.data.code ? payload.data.code.trim() : current.code,
    name: payload.data.name ? payload.data.name.trim() : current.name,
    location: payload.data.location !== undefined ? payload.data.location.trim() || null : current.location,
    description: payload.data.description !== undefined ? payload.data.description.trim() || null : current.description,
    capacity: payload.data.capacity ?? current.capacity,
    updatedAt: new Date().toISOString(),
  };

  stores[index] = updated;
  await writeStores(stores);
  res.json(mapResponse(updated));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid_store_id' });
    return;
  }

  const stores = await readStores();
  const next = stores.filter((store) => store.id !== id);
  if (next.length === stores.length) {
    res.status(404).json({ error: 'store_not_found' });
    return;
  }

  await writeStores(next);
  res.status(204).send();
});

export default router;
