export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function getRequests() {
  const res = await fetch(`${API_URL}/api/requests`);
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

export async function createRequest(payload: {
  title: string;
  type: string;
  department: string;
  priority: "Low" | "Medium" | "High";
  quantity: number;
  specs?: string;
}) {
  const res = await fetch(`${API_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ? JSON.stringify(err.error) : "Failed to create request");
  }
  return res.json();
}
