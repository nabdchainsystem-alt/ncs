import express from "express";
import { prisma } from "../db";
import { loadRequestWithMeta, recalcQuantity } from "../services/request.service.js";

const router = express.Router();

// Existing POST route for sending RFQ
router.post("/:id/items/:itemId/rfq", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
});

// Alias: explicit send endpoint
router.post("/:id/items/:itemId/rfq/send", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.update({ where: { id: itemId }, data: { status: "RFQ_SENT" } });
    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/requests/:id/items/:itemId/rfq/send failed", err);
    res.status(500).json({ error: "Failed to send RFQ" });
  }
});

// Delete a single item
router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(id) || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    await prisma.requestItem.delete({ where: { id: itemId } });
    await recalcQuantity(id);
    const updated = await loadRequestWithMeta(id);
    return res.json(updated);
  } catch (err) {
    console.error("DELETE /api/requests/:id/items/:itemId failed", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
