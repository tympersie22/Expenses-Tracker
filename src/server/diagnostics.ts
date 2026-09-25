import { z } from "zod";

// Treat client diagnostics as untrusted. Never forward raw stack payloads, paths,
// exception messages, receipt text, or arbitrary client-provided properties.
const metricKit = z.object({
  crashDiagnostics: z.array(z.unknown()).max(1000).optional(),
  hangDiagnostics: z.array(z.unknown()).max(1000).optional(),
  cpuExceptionDiagnostics: z.array(z.unknown()).max(1000).optional(),
  diskWriteExceptionDiagnostics: z.array(z.unknown()).max(1000).optional(),
  appLaunchDiagnostics: z.array(z.unknown()).max(1000).optional(),
  appLaunchMetrics: z.object({}).optional(),
  appResponsivenessMetrics: z.object({}).optional(),
  cpuMetrics: z.object({}).optional(),
  memoryMetrics: z.object({}).optional(),
  networkTransferMetrics: z.object({}).optional(),
});
export function sanitizeIOSDiagnostic(value: unknown) {
  const data = metricKit.parse(value);
  return {
    crashes: data.crashDiagnostics?.length ?? 0,
    hangs: data.hangDiagnostics?.length ?? 0,
    cpuExceptions: data.cpuExceptionDiagnostics?.length ?? 0,
    diskWriteExceptions: data.diskWriteExceptionDiagnostics?.length ?? 0,
    launchDiagnostics: data.appLaunchDiagnostics?.length ?? 0,
    metricCategories: ["appLaunchMetrics", "appResponsivenessMetrics", "cpuMetrics", "memoryMetrics", "networkTransferMetrics"].filter((key) => key in data),
  };
}
