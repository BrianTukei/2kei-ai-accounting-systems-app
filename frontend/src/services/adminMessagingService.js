export async function fetchUsers() {
  const res = await fetch("/api/admin/users", { credentials: "include" });
  return res.json();
}

export async function sendEmail({ userId, emails, subject, message }) {
  const res = await fetch("/api/admin/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, emails, subject, message })
  });
  return res.json();
}
