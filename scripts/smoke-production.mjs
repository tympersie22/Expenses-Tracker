const base = process.env.SMOKE_BASE_URL;
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
if (!base || !email || !password) throw new Error("SMOKE_BASE_URL, SMOKE_EMAIL, and SMOKE_PASSWORD are required.");
const origin = new URL(base).origin;
async function request(path, options = {}) {
  const response = await fetch(new URL(path, origin), options);
  const body = await response.text();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${body.slice(0, 200)}`);
  return { response, body };
}
const health = JSON.parse((await request("/api/health")).body);
if (health.status !== "ok") throw new Error("Health response was not ready.");
const login = await request("/api/auth/login", {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const cookie = login.response.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("Login did not return a session cookie.");
const authenticated = { headers: { Cookie: cookie } };
const snapshot = JSON.parse((await request("/api/finance/snapshot", authenticated)).body);
if (snapshot.user.email.toLowerCase() !== email.toLowerCase()) throw new Error("Authenticated snapshot belongs to the wrong user.");
const archive = JSON.parse((await request("/api/finance/full-export", authenticated)).body);
if (archive.format !== "expenses-tracker-export") throw new Error("Full export format is invalid.");
await request("/api/auth/logout", { method: "POST", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: "{}" });
console.log(JSON.stringify({ ok: true, release: health.release, email: snapshot.user.email }));
