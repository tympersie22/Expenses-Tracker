import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { AppError } from "./errors";
import { reportServerError } from "./observability";
export function json(data: unknown, status = 200) {
  return new NextResponse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
export function assertOrigin(request: Request) {
  const configured = process.env.APP_ORIGIN;
  if (!configured)
    throw new AppError("Application origin is not configured.", 503);
  const origin = new URL(configured).origin;
  if (request.headers.get("origin") !== origin)
    throw new AppError("Request origin is not allowed.", 403);
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site")
    throw new AppError("Cross-site requests are not allowed.", 403);
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError("Send JSON data.", 415);
  if (Number(request.headers.get("content-length") ?? 0) > 600_000)
    throw new AppError("Request is too large.", 413);
  // Limit streamed bodies too; Content-Length is not trusted.
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("Request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > 600_000) {
      await reader.cancel();
      throw new AppError("Request is too large.", 413);
    }
    chunks.push(next.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("Invalid JSON data.");
  }
}
export async function handle(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AppError)
      return json({ error: error.message }, error.status);
    if (error instanceof ZodError)
      return json({ error: error.issues[0]?.message ?? "Invalid input." }, 400);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return json(
        { error: "This record already exists. Refresh and try again." },
        409,
      );
    const requestId = randomUUID();
    await reportServerError(error, requestId);
    return json(
      { error: "Something went wrong. Please try again.", requestId },
      500,
    );
  }
}
