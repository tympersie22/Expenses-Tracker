import { db } from "@/server/db";
import { productionConfigIssues } from "@/server/config";
export async function GET() {
  const started = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const configuration = productionConfigIssues();
    if (configuration.length)
      return Response.json({ status: "unavailable", reason: "configuration", checksFailed: configuration }, { status: 503, headers: { "Cache-Control": "no-store" } });
    return Response.json(
      { status: "ok", database: "available", latencyMs: Date.now() - started, release: process.env.RELEASE_SHA ?? process.env.RENDER_GIT_COMMIT ?? "development" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
