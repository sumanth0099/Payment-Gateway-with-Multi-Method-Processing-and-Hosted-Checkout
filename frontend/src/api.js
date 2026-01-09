const API_BASE = "http://localhost:8000/api/v1";

export async function getTestMerchant() {
  const res = await fetch(`${API_BASE}/test/merchant`);
  if (!res.ok) throw new Error(await res.text()); // Better error
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`); // Use API_BASE
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/dashboard/transactions`); // Use API_BASE
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
