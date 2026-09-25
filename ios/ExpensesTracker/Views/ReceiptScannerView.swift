import SwiftUI
import PhotosUI
import Vision
import PDFKit
import UniformTypeIdentifiers

struct ScannedReceipt {
  let merchant: String
  let amount: String
  let date: Date?
  let rawText: String
}

enum ReceiptReader {
  static func recognize(_ image: UIImage) async throws -> String {
    guard let cgImage = image.cgImage else { throw AppFailure.message("This image could not be opened.") }
    return try await Task.detached(priority: .userInitiated) {
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      request.automaticallyDetectsLanguage = true
      try VNImageRequestHandler(cgImage: cgImage).perform([request])
      return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
    }.value
  }

  static func parse(_ text: String, currency: String) -> ScannedReceipt {
    let lines = text.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespaces) }
      .filter { !$0.isEmpty }
    let merchant = lines.first { line in
      line.rangeOfCharacter(from: .letters) != nil &&
        !line.lowercased().contains("receipt") && !line.lowercased().contains("invoice")
    } ?? ""
    let pattern = #"(?<!\d)(\d{1,3}(?:[ ,.']\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?!\d)"#
    let regex = try? NSRegularExpression(pattern: pattern)
    let ranked: [(Int, Decimal)] = lines.enumerated().flatMap { index, line -> [(Int, Decimal)] in
      let ns = line as NSString
      let matches = regex?.matches(in: line, range: NSRange(location: 0, length: ns.length)) ?? []
      let lower = line.lowercased()
      let rank = lower.contains("grand total") || lower.contains("amount due") || lower.contains("jumla kuu")
        ? 100 : lower.contains("total") || lower.contains("jumla") || lower.contains("payable")
          ? 80 : lower.contains("subtotal") || lower.contains("tax") || lower.contains("vat")
            ? -50 : 0
      return matches.compactMap { match in
        let raw = ns.substring(with: match.range).replacingOccurrences(of: " ", with: "")
          .replacingOccurrences(of: "'", with: "")
        // Printed receipts use both 1,234.50 and 1.234,50; the rightmost mark is the decimal mark.
        let comma = raw.lastIndex(of: ","), dot = raw.lastIndex(of: ".")
        let decimalMark: Character? = {
          if let comma, let dot { return comma > dot ? "," : "." }
          if let comma, raw.distance(from: comma, to: raw.endIndex) <= 3 { return "," }
          return dot == nil ? nil : "."
        }()
        let digits = raw.filter { $0.isNumber }
        guard !digits.isEmpty else { return nil }
        let normalized: String
        if let mark = decimalMark, let position = raw.lastIndex(of: mark) {
          let places = raw.distance(from: raw.index(after: position), to: raw.endIndex)
          normalized = String(digits.dropLast(places)) + "." + String(digits.suffix(places))
        } else { normalized = digits }
        guard let value = Decimal(string: normalized, locale: Locale(identifier: "en_US_POSIX")),
          value > 0, value < 100_000_000_000 else { return nil }
        return (rank - index, value)
      }
    }
    let best = ranked.max { lhs, rhs in
      if lhs.0 == rhs.0 { return lhs.1 < rhs.1 }
      return lhs.0 < rhs.0
    }
    let amount = best.map { NSDecimalNumber(decimal: $0.1).stringValue } ?? ""
    let date = lines.compactMap { line -> Date? in
      for format in ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "MM/dd/yyyy"] {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = format
        formatter.isLenient = false
        if let range = line.range(of: #"\b\d{1,4}[-/]\d{1,2}[-/]\d{2,4}\b"#, options: .regularExpression),
          let date = formatter.date(from: String(line[range])), date <= Date() { return date }
      }
      return nil
    }.first
    return ScannedReceipt(merchant: merchant, amount: amount, date: date, rawText: text)
  }
}

private struct ReceiptCamera: UIViewControllerRepresentable {
  @Environment(\.dismiss) private var dismiss
  let onImage: (UIImage) -> Void
  func makeUIViewController(context: Context) -> UIImagePickerController {
    let picker = UIImagePickerController()
    picker.sourceType = .camera
    picker.delegate = context.coordinator
    return picker
  }
  func updateUIViewController(_ controller: UIImagePickerController, context: Context) {}
  func makeCoordinator() -> Coordinator { Coordinator(self) }
  final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    let parent: ReceiptCamera
    init(_ parent: ReceiptCamera) { self.parent = parent }
    func imagePickerController(_ picker: UIImagePickerController,
      didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
      if let image = info[.originalImage] as? UIImage { parent.onImage(image) }
      parent.dismiss()
    }
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { parent.dismiss() }
  }
}

struct ReceiptScannerView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject private var store: AppStore
  let onUse: (ScannedReceipt) -> Void
  @State private var photo: PhotosPickerItem?
  @State private var documentPicker = false
  @State private var camera = false
  @State private var busy = false
  @State private var error: String?
  @State private var receipt: ScannedReceipt?
  var body: some View {
    NavigationStack {
      Form {
        Section {
          Text("Scan a receipt or invoice").font(Well.title(32))
          Text("Text is read on this device. Check the details before recording a transaction.")
            .foregroundStyle(.secondary)
        }.listRowBackground(Color.clear)
        Section("Choose a source") {
          if UIImagePickerController.isSourceTypeAvailable(.camera) {
            Button { camera = true } label: { Label("Take photo", systemImage: "camera") }
          }
          PhotosPicker(selection: $photo, matching: .images) {
            Label("Choose photo", systemImage: "photo.on.rectangle")
          }
          Button { documentPicker = true } label: { Label("Choose PDF", systemImage: "doc") }
        }
        if busy { Section { ProgressView("Reading document…") } }
        if let error { Section { ErrorNotice(text: error) } }
        if let receipt {
          Section("Review scan") {
            LabeledContent("Merchant", value: receipt.merchant.isEmpty ? "Not found" : receipt.merchant)
            LabeledContent("Amount", value: receipt.amount.isEmpty ? "Not found" : receipt.amount)
            LabeledContent("Date", value: receipt.date.map { $0.formatted(date: .abbreviated, time: .omitted) } ?? "Not found")
            Text(receipt.rawText).font(.caption.monospaced()).textSelection(.enabled)
              .lineLimit(12).foregroundStyle(.secondary)
          }
          Section {
            PrimaryButton(title: "Review transaction", icon: "arrow.right") {
              onUse(receipt)
              dismiss()
            }
          }.listRowBackground(Color.clear)
        }
      }.scrollContentBackground(.hidden).background(Well.paper)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Close") { dismiss() } } }
    }
    .onChange(of: photo) { _, item in
      guard let item else { return }
      Task {
        do {
          guard let data = try await item.loadTransferable(type: Data.self), data.count <= 20_000_000,
            let image = UIImage(data: data) else { throw AppFailure.message("Choose an image smaller than 20 MB.") }
          await read(image)
        } catch { self.error = error.localizedDescription }
      }
    }
    .sheet(isPresented: $camera) { ReceiptCamera { image in Task { await read(image) } } }
    .fileImporter(isPresented: $documentPicker, allowedContentTypes: [.pdf]) { selection in
      do {
        let url = try selection.get()
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size <= 20_000_000, let pdf = PDFDocument(url: url), let page = pdf.page(at: 0) else {
          throw AppFailure.message("Choose a PDF smaller than 20 MB with at least one page.")
        }
        let image = page.thumbnail(of: CGSize(width: 2000, height: 2800), for: .mediaBox)
        Task { await read(image) }
      } catch { self.error = error.localizedDescription }
    }
  }
  private func read(_ image: UIImage) async {
    busy = true
    error = nil
    receipt = nil
    defer { busy = false }
    do {
      let text = try await ReceiptReader.recognize(image)
      guard !text.isEmpty else { throw AppFailure.message("No readable text was found. Try a sharper image.") }
      receipt = ReceiptReader.parse(text, currency: store.selectedCurrency)
    } catch { self.error = error.localizedDescription }
  }
}
