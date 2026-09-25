import SwiftUI

struct AccountsView: View {
  @EnvironmentObject private var store: AppStore
  @Binding var entry: EntryKind?
  @State private var selected: MoneyAccount?
  var body: some View {
    VStack(alignment: .leading, spacing: 24) {
      Text("Your accounts.").font(Well.title(34)).tracking(-1)
      Text("Every recorded balance, in its original currency.").font(.subheadline).foregroundStyle(
        .secondary)
      if store.accounts.isEmpty {
        EmptyCard(
          icon: "wallet.bifold", title: "Add your first account.",
          detail: "Add an account in \(store.selectedCurrency), or choose another currency above.",
          action: "Add account"
        ) { entry = .account }
      }
      ForEach(Array(store.accounts.enumerated()), id: \.element.id) { index, account in
        Panel {
          VStack(alignment: .leading, spacing: 24) {
            HStack {
              IconTile(symbol: account.icon)
              Spacer()
              Button { selected = account } label: { Image(systemName: "ellipsis").frame(width: 44, height: 44) }
                .accessibilityLabel("Edit \(account.name)")
              Text(account.currency).font(.caption.weight(.semibold)).padding(.horizontal, 12)
                .padding(.vertical, 7).background(Well.accent.opacity(0.08), in: Capsule())
            }
            VStack(alignment: .leading, spacing: 7) {
              Text(account.name).font(.headline)
              Text(LocalizedStringKey(account.kind.replacingOccurrences(of: "-", with: " ").capitalized)).font(.caption)
                .foregroundStyle(.secondary)
            }
            MoneyText(amount: account.balance, currency: account.currency).font(Well.title(34))
              .lineLimit(1).minimumScaleFactor(0.6)
          }
        }.arrive(Double(min(index, 5)) * 0.04)
      }
      PrimaryButton(title: "Add account", icon: "plus") { entry = .account }
      Label(
        "Accounts are manually maintained. Recording a transfer here does not move money at your bank.",
        systemImage: "info.circle"
      ).font(.caption).foregroundStyle(.secondary)
    }.arrive()
      .sheet(item: $selected) { AccountEditSheet(account: $0).environmentObject(store) }
  }
}

private struct AccountEditSheet: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  let account: MoneyAccount
  @State private var name: String
  @State private var kind: String
  @State private var busy = false
  @State private var error: String?
  @State private var confirmsClose = false
  init(account: MoneyAccount) { self.account = account; _name = State(initialValue: account.name); _kind = State(initialValue: account.kind) }
  var body: some View {
    NavigationStack { Form {
      Section("Account") { TextField("Name", text: $name); Picker("Type", selection: $kind) {
        Text("Bank account").tag("bank"); Text("Cash").tag("cash"); Text("Mobile money").tag("mobile-money"); Text("Savings").tag("savings"); Text("Wallet").tag("wallet")
      }; LabeledContent("Currency", value: account.currency) }
      if let error { Section { ErrorNotice(text: error) } }
      Section { Button("Save changes") { run { try await store.mutate("accounts", body: ["id": account.id, "name": name, "kind": kind], method: "PATCH"); dismiss() } } }
      Section { Button("Close account", role: .destructive) { confirmsClose = true } } footer: { Text("The balance must be zero and the account cannot have active goals or unpaid bills. History is retained.") }
    }.disabled(busy).navigationTitle("Edit account").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
      .confirmationDialog("Close this account?", isPresented: $confirmsClose, titleVisibility: .visible) { Button("Close account", role: .destructive) { run { try await store.mutate("accounts", body: ["id": account.id], method: "DELETE"); dismiss() } } }
    }
  }
  private func run(_ work: @escaping () async throws -> Void) { busy = true; error = nil; Task { defer { busy = false }; do { try await work() } catch { self.error = error.localizedDescription } } }
}
