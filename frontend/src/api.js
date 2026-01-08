const API_BASE = "http://localhost:8000/api/v1"; // change if needed

export async function getTestMerchant() {
  const res = await fetch(`${API_BASE}/test/merchant`);
  if (!res.ok) throw new Error("Merchant not found");
  return res.json();
}

export async function getDashboardStats() {
    const res = await fetch("http://localhost:8000/api/v1/dashboard/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  }
  