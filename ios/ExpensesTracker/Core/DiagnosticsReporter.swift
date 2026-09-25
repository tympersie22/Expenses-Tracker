import Foundation
import MetricKit
import os

final class DiagnosticsReporter: NSObject, MXMetricManagerSubscriber {
  static let shared = DiagnosticsReporter()
  private let logger = Logger(subsystem: "com.expensestracker.app", category: "diagnostics")
  func start() { MXMetricManager.shared.add(self) }
  func stop() { MXMetricManager.shared.remove(self) }
  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    payloads.forEach { upload($0.jsonRepresentation()) }
  }
  func didReceive(_ payloads: [MXMetricPayload]) {
    payloads.forEach { upload($0.jsonRepresentation()) }
  }
  private func upload(_ data: Data) {
      logger.error("MetricKit diagnostic received (\(data.count, privacy: .public) bytes)")
      guard data.count <= 250_000 else { return }
      let encoded = data.base64EncodedString()
      Task { @MainActor in
        do { _ = try await APIClient().request("api/finance/diagnostics", method: "POST", body: ["payload": encoded]) }
        catch { self.logger.error("Diagnostic upload failed: \(error.localizedDescription, privacy: .public)") }
      }
  }
}
