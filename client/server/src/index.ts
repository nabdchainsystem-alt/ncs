import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Route تجريبي
app.get("/", (req, res) => {
  res.send("✅ NCS API is working!");
});

// Routes حقيقية مبدئية

// Requests
app.get("/api/requests", (req, res) => {
  res.json([
    { id: 1, title: "Laptop Purchase", status: "New", dept: "IT" },
    { id: 2, title: "Office Chairs", status: "Approved", dept: "Admin" },
  ]);
});

// Orders
app.get("/api/orders", (req, res) => {
  res.json([
    { id: 101, vendor: "Acme Corp", status: "Pending", amount: 5000 },
    { id: 102, vendor: "TechWorld", status: "Completed", amount: 12000 },
  ]);
});

// Inventory
app.get("/api/inventory", (req, res) => {
  res.json([
    { id: "I001", name: "Laptops", qty: 25 },
    { id: "I002", name: "Printers", qty: 10 },
  ]);
});

// Vendors
app.get("/api/vendors", (req, res) => {
  res.json([
    { id: "V001", name: "Acme Corp", active: true },
    { id: "V002", name: "TechWorld", active: false },
  ]);
});

// Reports
app.get("/api/reports", (req, res) => {
  res.json([
    { id: "R001", title: "Monthly Spend", created: "2025-09-01" },
    { id: "R002", title: "Vendor Performance", created: "2025-08-15" },
  ]);
});

app.listen(PORT, () => {
  console.log(`NCS API running on http://localhost:${PORT}`);
});