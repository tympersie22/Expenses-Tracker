import SwiftUI

struct ActivityView: View {
  @EnvironmentObject private var store: AppStore
  @State private var search = ""
  @State private var filter = "All"
  @State private var selected: Movement?
  @State private var importCSV = false
  @State private var exportURL: URL?
  @State private var error: String?
  @State private var exporting = false
  private var movements: [Movement] {
    (store.snapshot?.movements ?? []).filter { movement in
      movement.entries.contains(where: { $0.currency == store.selectedCurrency })
        && (filter == "All" || movement.kind == filter.lowercased())
        && (search.isEmpty || movement.description.localizedCaseInsensitiveContains(search)
          || movement.category.localizedCaseInsensitiveContains(search))
    }
  }
  var body: some View {
    VStack(alignment: .leading, spacing: 22) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 7) {
          Text("All activity.").font(Well.title(34)).tracking(-1)
          Text("Search your records and review incoming statements.").font(.subheadline).foregroundStyle(.secondary)
        }
        Spacer()
        Menu {
          Button("Financial inbox", systemImage: "tray.full") { importCSV = true }
          Button("Export all records", systemImage: "square.and.arrow.up") { export() }.disabled(
            exporting)
        } label: {
          Image(systemName: "ellipsis").font(.title3).frame(width: 44, height: 44).background(
            Well.card, in: Circle())
        }.accessibilityLabel("Activity options")
      }
      HStack {
        Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
        TextField("Search your activity", text: $search).accessibilityIdentifier("activitySearch")
      }.padding(16).background(Well.card, in: RoundedRectangle(cornerRadius: 18))
      Picker("Transaction type", selection: $filter) {
        ForEach(["All", "Expense", "Income", "Transfer"], id: \.self) { Text(LocalizedStringKey($0)).tag($0) }
      }.pickerStyle(.segmented)
      Button { importCSV = true } label: {
        HStack(spacing: 14) {
          IconTile(symbol: "tray.full")
          VStack(alignment: .leading, spacing: 4) {
            Text("Financial inbox").font(.subheadline.weight(.semibold))
            Text("Import and reconcile a statement").font(.caption).foregroundStyle(.secondary)
          }
          Spacer()
          Image(systemName: "arrow.up.right").font(.caption.weight(.semibold))
        }
      }.buttonStyle(.plain)
      if let error { ErrorNotice(text: error) }
      if let exportURL {
        ShareLink(item: exportURL) {
          Label("Share your CSV export", systemImage: "square.and.arrow.up").font(
            .subheadline.weight(.semibold))
        }.frame(minHeight: 44)
      }
      if movements.isEmpty {
        EmptyCard(
          icon: "arrow.left.arrow.right", title: "No activity yet.",
          detail: search.isEmpty
            ? "Record your first transaction with the + button below."
            : "No records match your search.")
      } else {
        Panel {
          LazyVStack(spacing: 0) {
            ForEach(movements) { movement in
              Button {
                selected = movement
              } label: {
                MovementRow(movement: movement).padding(.vertical, 12).contentShape(Rectangle())
              }.buttonStyle(.plain)
              if movement.id != movements.last?.id { Divider() }
            }
          }
        }
      }
    }.arrive()
      .sheet(item: $selected) {
        MovementDetail(movement: $0).environmentObject(store).presentationDetents([.medium, .large])
          .presentationDragIndicator(.visible)
      }
      .sheet(isPresented: $importCSV) { ImportView().environmentObject(store) }
  }
  private func export() {
    exporting = true
    error = nil
    Task {
      defer { exporting = false }
      do {
        let data = try await store.api.request("api/finance/export")
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
          "ExpensesTrackerExports", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        for file in try FileManager.default.contentsOfDirectory(
          at: folder, includingPropertiesForKeys: nil)
        { try FileManager.default.removeItem(at: file) }
        let url = folder.appendingPathComponent("expenses-tracker-transactions.csv")
        try data.write(to: url, options: [.atomic, .completeFileProtection])
        exportURL = url
      } catch { self.error = error.localizedDescription }
    }
  }
}
struct MovementDetail: View {
  @Environment(\.locale) private var locale
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  let movement: Movement
  @State private var confirm = false
  @State private var busy = false
  @State private var error: String?
  @State private var correcting = false
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          IconTile(symbol: movement.icon)
          Text(movement.description).font(Well.title(32))
          Text("\(movement.category) · \(CalendarDay.label(movement.date, locale: locale))").foregroundStyle(
            .secondary)
          ForEach(movement.entries, id: \.accountId) { e in
            HStack {
              Text(e.accountName)
              Spacer()
              MoneyText(amount: e.amount, currency: e.currency).font(.title3.weight(.medium))
            }
          }
          if let error { ErrorNotice(text: error) }
          if movement.kind != "opening" {
            if movement.billId == nil && movement.kind != "transfer" { Button("Correct transaction") { correcting = true }.frame(minHeight: 44).disabled(busy) }
            Button("Remove transaction", role: .destructive) { confirm = true }.frame(minHeight: 44)
              .disabled(busy)
          }
          Text(
            "Removing a transaction reverses its effect on your balances. The audit record is retained."
          ).font(.caption).foregroundStyle(.secondary)
        }.padding(26)
      }.background(Well.paper).toolbar {
        ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } }
      }
      .confirmationDialog(
        "Remove this transaction?", isPresented: $confirm, titleVisibility: .visible
      ) {
        Button("Remove transaction", role: .destructive) {
          busy = true
          Task {
            do {
              try await store.mutate("transactions", body: ["id": movement.id], method: "DELETE")
              dismiss()
            } catch {
              self.error = error.localizedDescription
              busy = false
            }
          }
        }
      } message: {
        Text("Your balances will be recalculated. A linked bill will become unpaid again.")
      }
      .sheet(isPresented: $correcting) { CorrectionSheet(movement: movement).environmentObject(store) }
    }
  }
}

private struct CorrectionSheet: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  let movement: Movement
  @State private var description: String
  @State private var amount: String
  @State private var category: String
  @State private var accountId: String
  @State private var date: Date
  @State private var busy = false
  @State private var error: String?
  private var entry: Entry { movement.entries.first(where: { $0.amount.hasPrefix("-") }) ?? movement.entries[0] }
  init(movement: Movement) {
    self.movement = movement
    let entry = movement.entries.first(where: { $0.amount.hasPrefix("-") }) ?? movement.entries[0]
    _description = State(initialValue: movement.description)
    _amount = State(initialValue: Money.input(entry.amount.hasPrefix("-") ? String(entry.amount.dropFirst()) : entry.amount, currency: entry.currency))
    _category = State(initialValue: movement.category)
    _accountId = State(initialValue: entry.accountId)
    _date = State(initialValue: CalendarDay.date(movement.date))
  }
  var body: some View { NavigationStack { Form {
    Section { Picker("Type", selection: .constant(movement.kind)) { Text(movement.kind.capitalized).tag(movement.kind) }.disabled(true); Picker("Account", selection: $accountId) { ForEach(store.snapshot?.accounts ?? []) { Text("\($0.name) · \($0.currency)").tag($0.id) } }; TextField("Description", text: $description); TextField("Amount", text: $amount).keyboardType(.decimalPad); DatePicker("Date", selection: $date, in: ...Date(), displayedComponents: .date); Picker("Category", selection: $category) { ForEach(categories, id: \.self) { Text(LocalizedStringKey($0)).tag($0) } } }
    if let error { Section { ErrorNotice(text: error) } }
    Section { Button("Save correction") { save() }.disabled(busy) } footer: { Text("The original record is voided and retained in the audit history.") }
  }.navigationTitle("Correct transaction").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { dismiss() }.disabled(busy) } } } }
  private func save() { busy = true; error = nil; Task { defer { busy = false }; do {
    let account = store.snapshot?.accounts.first { $0.id == accountId }
    let normalized = try Money.normalizedInput(amount, currency: account?.currency ?? entry.currency)
    try await store.mutate("transactions", body: ["id": movement.id, "accountId": accountId, "kind": movement.kind, "description": description, "category": category, "amount": normalized, "date": CalendarDay.string(date, zone: store.snapshot?.user.timeZone ?? "UTC"), "idempotencyKey": UUID().uuidString], method: "PATCH")
    dismiss()
  } catch { self.error = error.localizedDescription } } }
}
