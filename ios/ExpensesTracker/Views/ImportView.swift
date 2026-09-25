import SwiftUI
import UniformTypeIdentifiers

private struct InboxPayload: Decodable {
  let batches: [InboxBatchSummary]
  let batch: InboxBatch?
}
private struct InboxBatchSummary: Decodable, Identifiable {
  let id, fileName, accountName, currency, createdAt: String
  let pending, reviewed: Int
}
private struct InboxBatch: Decodable, Identifiable {
  let id, fileName, accountId, accountName, currency: String
  let reconciliation: Reconciliation
  let items: [InboxItem]
  var pendingCount: Int { items.filter { $0.status == "pending" }.count }
}
private struct Reconciliation: Decodable {
  let statementDate, ledgerBalance: String
  let closingBalance, difference: String?
  let balanced: Bool
}
private struct InboxItem: Decodable, Identifiable {
  let id, date, description, category, type, amount, status: String
  let rowNumber: Int
  let suggestedMatch: InboxMatch?
  let matchedMovementId, postedMovementId: String?
}
private struct InboxMatch: Decodable { let id, description, date: String }

struct ImportView: View {
  @Environment(\.locale) private var locale
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  @State private var accountID = ""
  @State private var picking = false
  @State private var rows: [StatementRow] = []
  @State private var fileName = ""
  @State private var closingBalance = ""
  @State private var statementDate = Date()
  @State private var inbox: InboxPayload?
  @State private var error: String?
  @State private var busy = false
  @State private var busyItem: String?
  @State private var showReviewed = false

  private var account: MoneyAccount? { store.snapshot?.accounts.first { $0.id == accountID } }
  private var pendingItems: [InboxItem] { inbox?.batch?.items.filter { $0.status == "pending" } ?? [] }
  private var reviewedItems: [InboxItem] { inbox?.batch?.items.filter { $0.status != "pending" } ?? [] }

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          VStack(alignment: .leading, spacing: 7) {
            Text("Financial inbox.").font(Well.title(34)).tracking(-1)
            Text("Review statement activity before it changes your balance.")
              .font(.subheadline).foregroundStyle(.secondary)
          }
          if store.snapshot?.accounts.isEmpty ?? true {
            EmptyCard(icon: "wallet.bifold", title: "Add an account first.",
              detail: "A statement needs an account so each transaction has a home.")
          } else {
            importComposer
            if let batch = inbox?.batch {
              batchHeader(batch)
              reconciliationCard(batch)
              SectionTitle(title: "To review · \(batch.pendingCount)")
              if pendingItems.isEmpty {
                EmptyCard(icon: "checkmark", title: "All rows reviewed.",
                  detail: "Check the balance difference above for anything still missing.")
              } else {
                LazyVStack(spacing: 12) {
                  ForEach(pendingItems) { item in reviewCard(item, currency: batch.currency) }
                }
              }
              if !reviewedItems.isEmpty {
                DisclosureGroup("Reviewed · \(reviewedItems.count)", isExpanded: $showReviewed) {
                  LazyVStack(spacing: 12) {
                    ForEach(reviewedItems) { item in reviewCard(item, currency: batch.currency) }
                  }.padding(.top, 12)
                }.font(.headline)
              }
            }
          }
          if let error { ErrorNotice(text: error) }
        }.padding(22).padding(.bottom, 20)
      }
      .scrollDismissesKeyboard(.interactively)
      .background(Well.paper)
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.disabled(busy) }
      }
      .onAppear {
        accountID = store.accounts.first?.id ?? store.snapshot?.accounts.first?.id ?? ""
        Task { await load() }
      }
      .onChange(of: accountID) { _, _ in rows = []; fileName = ""; error = nil }
      .fileImporter(isPresented: $picking, allowedContentTypes: [.commaSeparatedText, .plainText]) {
        selection in
        do {
          let url = try selection.get()
          let granted = url.startAccessingSecurityScopedResource()
          defer { if granted { url.stopAccessingSecurityScopedResource() } }
          let metadata = try url.resourceValues(forKeys: [.fileSizeKey])
          guard (metadata.fileSize ?? 500_001) <= 500_000 else {
            throw AppFailure.message("Choose a CSV smaller than 500 KB.")
          }
          guard let text = String(data: try Data(contentsOf: url), encoding: .utf8) else {
            throw AppFailure.message("Save this statement as a UTF-8 CSV file.")
          }
          rows = try StatementCSV.parse(text, currency: account?.currency ?? "USD")
          fileName = url.lastPathComponent
          if let last = rows.map(\.date).max() { statementDate = CalendarDay.date(last) }
          closingBalance = ""
          error = nil
        } catch { rows = []; self.error = error.localizedDescription }
      }
    }.interactiveDismissDisabled(busy)
  }

  private var importComposer: some View {
    VStack(alignment: .leading, spacing: 14) {
      SectionTitle(title: "Add a statement")
      Panel {
        VStack(alignment: .leading, spacing: 16) {
          Picker("Account", selection: $accountID) {
            ForEach(store.snapshot?.accounts ?? []) {
              Text("\($0.name) · \($0.currency)").tag($0.id)
            }
          }
          Divider()
          Button { picking = true } label: {
            HStack(spacing: 12) {
              IconTile(symbol: "doc.badge.plus")
              VStack(alignment: .leading, spacing: 4) {
                Text(fileName.isEmpty ? "Choose CSV file" : fileName).font(.subheadline.weight(.semibold))
                Text("Up to 500 rows · 500 KB").font(.caption).foregroundStyle(.secondary)
              }
              Spacer()
              Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }.frame(minHeight: 48)
          }.buttonStyle(.plain)
          if !rows.isEmpty {
            Divider()
            Text("\(rows.count) rows ready for review").font(.subheadline.weight(.semibold))
          Text("Date, description, amount, and type are required. Credit, debit, deposit, and withdrawal are accepted. Bank categories are matched when possible.")
              .font(.caption).foregroundStyle(.secondary)
            DatePicker("Statement date", selection: $statementDate, in: ...Date(), displayedComponents: .date)
              .font(.subheadline)
            HStack {
              Text("Closing balance")
              Spacer()
              TextField("Optional", text: $closingBalance)
                .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
              Text(account?.currency ?? "").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }.font(.subheadline)
            PrimaryButton(title: "Review statement", busy: busy, icon: "arrow.right") { stage() }
          }
        }
      }
    }
  }

  private func batchHeader(_ batch: InboxBatch) -> some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        Text("Current statement").font(.caption).foregroundStyle(.secondary)
        Text(batch.fileName).font(.headline).lineLimit(1)
        Text("\(batch.accountName) · \(batch.currency)").font(.caption).foregroundStyle(.secondary)
      }
      Spacer()
      Menu {
        ForEach(inbox?.batches ?? []) { summary in
          Button("\(summary.fileName) · \(summary.pending) pending") {
            Task { await load(batchId: summary.id) }
          }
        }
      } label: { Label("Statements", systemImage: "chevron.down").font(.caption.weight(.semibold)) }
    }
  }

  private func reconciliationCard(_ batch: InboxBatch) -> some View {
    Panel {
      VStack(alignment: .leading, spacing: 16) {
        HStack {
          Text("Balance check").font(.headline)
          Spacer()
          if batch.reconciliation.balanced {
            Label("Balanced", systemImage: "checkmark.circle.fill")
              .font(.caption.weight(.semibold)).foregroundStyle(Well.positive)
          }
        }
        balanceLine("Recorded through \(CalendarDay.label(batch.reconciliation.statementDate, locale: locale))",
          "\(batch.reconciliation.ledgerBalance) \(batch.currency)")
        balanceLine("Statement closing balance",
          batch.reconciliation.closingBalance.map { "\($0) \(batch.currency)" } ?? "Not set")
        if let difference = batch.reconciliation.difference {
          Divider()
          balanceLine("Difference", "\(difference) \(batch.currency)")
        }
        DisclosureGroup("Update statement balance") {
          VStack(spacing: 12) {
            HStack {
              Text("Closing balance")
              Spacer()
              TextField("Amount", text: $closingBalance)
                .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
              Text(batch.currency).font(.caption).foregroundStyle(.secondary)
            }
            DatePicker("Statement date", selection: $statementDate, in: ...Date(), displayedComponents: .date)
            Button("Save balance check") { updateBalance(batch.id) }
              .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 44)
              .disabled(busy)
          }.padding(.top, 8)
        }.font(.subheadline).foregroundStyle(Well.positive)
      }
    }
  }
  private func balanceLine(_ title: String, _ value: String) -> some View {
    HStack {
      Text(title).foregroundStyle(.secondary)
      Spacer()
      Text(value).monospacedDigit()
    }.font(.subheadline)
  }

  private func reviewCard(_ item: InboxItem, currency: String) -> some View {
    Panel {
      VStack(alignment: .leading, spacing: 14) {
        HStack(alignment: .top) {
          VStack(alignment: .leading, spacing: 5) {
            Text(item.description).font(.subheadline.weight(.semibold))
            Text("\(CalendarDay.label(item.date, locale: locale)) · \(item.category)")
              .font(.caption).foregroundStyle(.secondary)
          }
          Spacer(minLength: 8)
          Text("\(item.type == "expense" ? "−" : "+")\(item.amount) \(currency)")
            .font(.subheadline.weight(.semibold)).monospacedDigit().lineLimit(1)
        }
        if item.status == "pending" {
          if let match = item.suggestedMatch {
            Label("Possible match: \(match.description) · \(CalendarDay.label(match.date, locale: locale))",
              systemImage: "arrow.triangle.2.circlepath")
              .font(.caption).foregroundStyle(.secondary)
          }
          HStack(spacing: 14) {
            if item.suggestedMatch != nil {
              Button("Match") { review("match", item: item) }.font(.subheadline.weight(.semibold))
            }
            Button(item.suggestedMatch == nil ? "Add to account" : "Add anyway") {
              review("post", item: item, force: item.suggestedMatch != nil)
            }.font(.subheadline.weight(.semibold))
            Button("Skip") { review("skip", item: item) }
              .font(.subheadline).foregroundStyle(.secondary)
          }.frame(minHeight: 44).disabled(busy || busyItem != nil)
        } else {
          HStack {
            Label(item.status.capitalized,
              systemImage: item.status == "posted" ? "checkmark.circle" : item.status == "matched" ? "link" : "minus.circle")
              .font(.caption).foregroundStyle(.secondary)
            Spacer()
            if item.status == "skipped" {
              Button("Restore") { review("restore", item: item) }
                .font(.caption.weight(.semibold)).disabled(busy || busyItem != nil)
            }
          }
        }
      }
    }
  }

  private func apply(_ value: InboxPayload) {
    inbox = value
    if let reconciliation = value.batch?.reconciliation {
      closingBalance = reconciliation.closingBalance ?? ""
      statementDate = CalendarDay.date(reconciliation.statementDate)
    }
  }
  private func load(batchId: String? = nil) async {
    do {
      let query = batchId.map { [URLQueryItem(name: "batchId", value: $0)] } ?? []
      let data = try await store.api.request("api/finance/inbox", query: query)
      apply(try JSONDecoder().decode(InboxPayload.self, from: data))
      error = nil
    } catch { self.error = error.localizedDescription }
  }
  private func stage() {
    guard !rows.isEmpty else { return }
    busy = true; error = nil
    Task {
      defer { busy = false }
      do {
        var body: [String: Any] = [
          "accountId": accountID, "fileName": fileName,
          "statementDate": CalendarDay.string(statementDate, zone: "UTC"),
          "rows": rows.map(\.payload),
        ]
        if !closingBalance.trimmingCharacters(in: .whitespaces).isEmpty {
          body["closingBalance"] = try Money.normalizedInput(
            closingBalance, currency: account?.currency ?? "USD", allowNegative: true)
        }
        let data = try await store.api.request("api/finance/inbox", method: "POST", body: body)
        apply(try JSONDecoder().decode(InboxPayload.self, from: data))
        rows = []; fileName = ""
      } catch { self.error = error.localizedDescription }
    }
  }
  private func updateBalance(_ batchId: String) {
    busy = true; error = nil
    Task {
      defer { busy = false }
      do {
        let value: String? = closingBalance.trimmingCharacters(in: .whitespaces).isEmpty
          ? nil : try Money.normalizedInput(
            closingBalance, currency: inbox?.batch?.currency ?? "USD", allowNegative: true)
        let data = try await store.api.request("api/finance/inbox", method: "PATCH", body: [
          "action": "balance", "batchId": batchId,
          "closingBalance": value as Any? ?? NSNull(),
          "statementDate": CalendarDay.string(statementDate, zone: "UTC"),
        ])
        apply(try JSONDecoder().decode(InboxPayload.self, from: data))
      } catch { self.error = error.localizedDescription }
    }
  }
  private func review(_ action: String, item: InboxItem, force: Bool = false) {
    busyItem = item.id; error = nil
    Task {
      defer { busyItem = nil }
      do {
        var body: [String: Any] = ["action": action, "itemId": item.id]
        if action == "post" { body["force"] = force }
        let data = try await store.api.request("api/finance/inbox", method: "PATCH", body: body)
        apply(try JSONDecoder().decode(InboxPayload.self, from: data))
        if action == "post" { store.successTick += 1; await store.refresh() }
      } catch { self.error = error.localizedDescription }
    }
  }
}
