import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const target = join(".next", "standalone");
if (!existsSync(join(target, "server.js"))) throw new Error("Next.js standalone server was not produced.");
mkdirSync(join(target, ".next"), { recursive: true });
cpSync(join(".next", "static"), join(target, ".next", "static"), { recursive: true, force: true });
if (existsSync("public")) cpSync("public", join(target, "public"), { recursive: true, force: true });
