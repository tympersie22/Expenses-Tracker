import SwiftUI

struct EntrySheet: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  let kind: EntryKind
  var goal: Goal? = nil
  var scannedReceipt: ScannedReceipt? = nil
  @State private var name = ""
  @State private var amount = ""
  @State private var reserved = ""
  @State private var currency = "USD"
  @State private var accountID = ""
  @State private var toAccountID = ""
  @State private var accountKind = "bank"
  @State private var transactionKind = "expense"
  @State private var category = "Other"
  @State private var date = Date()
  @State private var idempotencyKey = UUID().uuidString
  @State private var busy = false
  @State private var error: String?
  @State private var accountFlowVisible = false
  @State private var accountSaved = false
  @FocusState private var focusedField: EntryField?

  private enum EntryField: Hashable { case name, amount }
  private struct AccountTypeOption: Identifiable {
    let id: String
    let title: String
    let symbol: String
  }
  private let accountTypes = [
    AccountTypeOption(id: "bank", title: "Bank", symbol: "building.columns.fill"),
    AccountTypeOption(id: "cash", title: "Cash", symbol: "banknote.fill"),
    AccountTypeOption(id: "mobile-money", title: "Mobile", symbol: "iphone.gen3"),
    AccountTypeOption(id: "savings", title: "Savings", symbol: "leaf.fill"),
    AccountTypeOption(id: "wallet", title: "Wallet", symbol: "wallet.bifold.fill"),
  ]
  private var selectedAccount: MoneyAccount? {
    store.snapshot?.accounts.first { $0.id == accountID }
  }
  private var effectiveCurrency: String {
    kind == .account || kind == .budget ? currency : selectedAccount?.currency ?? currency
  }
  private var needsAccount: Bool { [.transaction, .goal, .bill].contains(kind) }
  private var fingerprint: String {
    [
      name, amount, reserved, currency, accountID, toAccountID, accountKind, transactionKind,
      category, String(date.timeIntervalSince1970),
    ].joined(separator: "|")
  }
  var body: some View {
    NavigationStack {
      Group {
        if kind == .account {
          accountFlow
        } else {
          standardForm
        }
      }
      .background(Well.paper)
      .environment(
        \.timeZone, TimeZone(identifier: store.snapshot?.user.timeZone ?? "UTC") ?? .gmt
      )
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Button("Cancel") { dismiss() }.disabled(busy)
        }
        if kind == .account {
          ToolbarItemGroup(placement: .keyboard) {
            Spacer()
            Button("Done") { focusedField = nil }.fontWeight(.semibold)
          }
        }
      }
      .onAppear {
        currency = store.selectedCurrency
        accountID = store.accounts.first?.id ?? store.snapshot?.accounts.first?.id ?? ""
        if kind == .transaction, let scannedReceipt {
          name = scannedReceipt.merchant
          amount = scannedReceipt.amount
          if let scannedDate = scannedReceipt.date { date = scannedDate }
        }
        if let goal {
          name = goal.name
          accountID = goal.accountId
          amount = Money.input(goal.target, currency: goal.currency)
          reserved = Money.input(goal.reserved, currency: goal.currency)
        }
        guard kind == .account else { return }
        if reduceMotion {
          accountFlowVisible = true
        } else {
          withAnimation(.easeOut(duration: 0.34)) { accountFlowVisible = true }
        }
      }
      .onChange(of: fingerprint) { _, _ in idempotencyKey = UUID().uuidString }
      .onChange(of: accountID) { _, _ in toAccountID = "" }
      .onChange(of: transactionKind) { _, value in
        if value == "income" { category = "Income" } else { category = "Other" }
      }
      .sensoryFeedback(.selection, trigger: accountKind)
      .sensoryFeedback(.success, trigger: accountSaved)
    }.interactiveDismissDisabled(busy)
  }

  private var standardForm: some View {
    Form {
        Section {
          VStack(alignment: .leading, spacing: 10) {
            Text(LocalizedStringKey(goal == nil ? kind.title : "Grow your goal")).font(Well.title(31)).tracking(-0.8)
            Text(LocalizedStringKey(subtitle)).font(.subheadline).foregroundStyle(.secondary)
          }.padding(.vertical, 12).listRowBackground(Color.clear)
        }
        if needsAccount && (store.snapshot?.accounts.isEmpty ?? true) {
          Section {
            Text("Add an account first so this record has a home.")
            Button("Close") { dismiss() }
          }
        } else {
          if kind == .transaction {
            Section {
              Picker("Type", selection: $transactionKind) {
                Text("Expense").tag("expense")
                Text("Income").tag("income")
                Text("Transfer").tag("transfer")
              }.pickerStyle(.segmented)
            }
          }
          Section {
            if kind != .budget {
              TextField(nameLabel, text: $name).accessibilityIdentifier("entryName")
            }
            HStack {
              Text(LocalizedStringKey(kind == .account ? "Opening balance" : kind == .goal ? "Target" : "Amount"))
              Spacer()
              TextField("0", text: $amount).multilineTextAlignment(.trailing).keyboardType(
                .decimalPad
              ).accessibilityIdentifier("entryAmount")
              Text(effectiveCurrency).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }
            if kind == .goal {
              HStack {
                Text("Reserve now")
                Spacer()
                TextField("0", text: $reserved).multilineTextAlignment(.trailing).keyboardType(
                  .decimalPad
                ).accessibilityIdentifier("entryReserved")
              }
            }
          }
          Section {
            if kind == .account {
              Picker("Account type", selection: $accountKind) {
                Text("Bank account").tag("bank")
                Text("Cash").tag("cash")
                Text("Mobile money").tag("mobile-money")
                Text("Savings").tag("savings")
                Text("Wallet").tag("wallet")
              }
            }
            if kind == .account || kind == .budget {
              Picker("Currency", selection: $currency) {
                ForEach(CurrencyData.codes, id: \.self) { Text($0).tag($0) }
              }
            }
            if needsAccount {
              Picker(
                transactionKind == "transfer" ? "From account" : "Account", selection: $accountID
              ) {
                ForEach(store.snapshot?.accounts ?? []) {
                  Text("\($0.name) · \($0.currency)").tag($0.id)
                }
              }
            }
            if kind == .transaction && transactionKind == "transfer" {
              Picker("To account", selection: $toAccountID) {
                Text("Choose an account").tag("")
                ForEach(
                  (store.snapshot?.accounts ?? []).filter {
                    $0.id != accountID && $0.currency == effectiveCurrency
                  }
                ) { Text($0.name).tag($0.id) }
              }
            }
            if kind == .budget || kind == .bill
              || (kind == .transaction && transactionKind != "transfer")
            {
              Picker("Category", selection: $category) {
                ForEach(categories, id: \.self) { Text(LocalizedStringKey($0)).tag($0) }
              }
            }
            if kind == .bill {
              DatePicker("Due date", selection: $date, displayedComponents: .date)
            }
            if kind == .account || kind == .transaction {
              DatePicker(
                kind == .account ? "Opening date" : "Date", selection: $date, in: ...Date(),
                displayedComponents: .date)
            }
          }
          if let error { Section { ErrorNotice(text: error).listRowBackground(Color.clear) } }
          Section {
            PrimaryButton(
              title: goal == nil
                ? "Save \(kind == .transaction ? "transaction" : kind.rawValue)" : "Save goal",
              busy: busy, icon: "checkmark"
            ) { save() }.listRowBackground(Color.clear).listRowInsets(EdgeInsets())
          }
        }
    }.disabled(busy).scrollContentBackground(.hidden)
  }

  private var accountFlow: some View {
    ZStack {
      Well.paper.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          accountHeader
            .accountReveal(accountFlowVisible, delay: 0, reduceMotion: reduceMotion)
          accountDetails
            .accountReveal(accountFlowVisible, delay: 0.04, reduceMotion: reduceMotion)
          openingBalanceEditor
            .accountReveal(accountFlowVisible, delay: 0.08, reduceMotion: reduceMotion)
          if let error {
            ErrorNotice(text: error)
              .transition(.opacity.combined(with: .move(edge: .bottom)))
          }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 28)
      }
      .scrollDismissesKeyboard(.interactively)
      .disabled(busy)
    }
    .safeAreaInset(edge: .bottom, spacing: 0) {
      accountSaveButton
        .accountReveal(accountFlowVisible, delay: 0.16, reduceMotion: reduceMotion)
    }
  }

  private var accountHeader: some View {
    VStack(alignment: .leading, spacing: 7) {
      Text("Add an account.")
        .font(Well.title(34))
        .tracking(-1)
      Text("Add the balance you use today. You can update it with transactions later.")
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .fixedSize(horizontal: false, vertical: true)
    }
    .accessibilityElement(children: .combine)
  }

  private var openingBalanceEditor: some View {
    VStack(alignment: .leading, spacing: 18) {
      HStack {
        Text("Opening balance")
          .font(.headline)
        Spacer()
        Text("Optional")
          .font(.caption.weight(.medium))
          .foregroundStyle(.secondary)
      }
      HStack(alignment: .firstTextBaseline, spacing: 12) {
        TextField("0", text: $amount)
          .font(.system(size: 42, weight: .semibold, design: .default))
          .monospacedDigit()
          .keyboardType(.decimalPad)
          .focused($focusedField, equals: .amount)
          .minimumScaleFactor(0.65)
          .accessibilityIdentifier("entryAmount")
        Menu {
          Picker("Currency", selection: $currency) {
            ForEach(CurrencyData.codes, id: \.self) { Text($0).tag($0) }
          }
        } label: {
          HStack(spacing: 5) {
            Text(currency).font(.subheadline.weight(.semibold)).monospaced()
            Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold))
          }
          .foregroundStyle(Well.positive)
          .frame(minHeight: 44)
        }
      }
      .contentShape(Rectangle())
      .onTapGesture { focusedField = .amount }

      Divider()

      HStack {
        Label("Opening date", systemImage: "calendar")
          .font(.subheadline.weight(.medium))
        Spacer()
        DatePicker("Opening date", selection: $date, in: ...Date(), displayedComponents: .date)
          .labelsHidden()
          .datePickerStyle(.compact)
      }
    }
    .padding(20)
    .background(Well.card, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .strokeBorder(.primary.opacity(0.05))
    }
  }

  private var accountDetails: some View {
    VStack(spacing: 0) {
      HStack(spacing: 14) {
        IconTile(symbol: selectedAccountType.symbol)
          .contentTransition(.symbolEffect(.replace))
        VStack(alignment: .leading, spacing: 4) {
          Text("Account name")
            .font(.caption)
            .foregroundStyle(.secondary)
          TextField("For example, Everyday account", text: $name)
            .font(.body.weight(.medium))
            .focused($focusedField, equals: .name)
            .submitLabel(.next)
            .onSubmit { focusedField = .amount }
            .accessibilityIdentifier("entryName")
        }
      }
      .padding(18)

      Divider().padding(.leading, 82)

      HStack(spacing: 14) {
        Image(systemName: "square.grid.2x2")
          .font(.system(size: 17, weight: .semibold))
          .frame(width: 46, height: 44)
          .foregroundStyle(.secondary)
        Text("Account type")
          .font(.subheadline.weight(.medium))
        Spacer()
        Menu {
          Picker("Account type", selection: $accountKind) {
            ForEach(accountTypes) { option in
              Label(LocalizedStringKey(option.title), systemImage: option.symbol).tag(option.id)
            }
          }
        } label: {
          HStack(spacing: 5) {
            Text(LocalizedStringKey(selectedAccountType.title)).font(.subheadline.weight(.semibold))
            Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold))
          }
          .foregroundStyle(Well.positive)
          .frame(minHeight: 44)
        }
      }
      .padding(.horizontal, 18)
      .padding(.vertical, 4)
    }
    .background(Well.card, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .strokeBorder(.primary.opacity(0.05))
    }
  }

  private var accountSaveButton: some View {
    Button(action: save) {
      HStack(spacing: 10) {
        if accountSaved {
          Image(systemName: "checkmark")
            .font(.system(size: 16, weight: .bold))
            .transition(.scale(scale: 0.8).combined(with: .opacity))
          Text("Account added")
        } else if busy {
          ProgressView().tint(Well.accentInk)
          Text("Adding account")
        } else {
          Text("Save account")
          Spacer()
          Image(systemName: "arrow.up.right")
        }
      }
      .font(.body.weight(.semibold))
      .padding(.horizontal, 22)
      .frame(maxWidth: .infinity, minHeight: 58)
      .foregroundStyle(Well.accentInk)
      .background(Well.accent, in: Capsule())
      .contentShape(Capsule())
    }
    .buttonStyle(PressStyle())
    .disabled(busy)
    .accessibilityIdentifier("Save account")
    .padding(.horizontal, 20)
    .padding(.top, 12)
    .padding(.bottom, 8)
    .background(.ultraThinMaterial)
    .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: busy)
    .animation(reduceMotion ? nil : .spring(response: 0.32, dampingFraction: 0.82), value: accountSaved)
  }

  private var selectedAccountType: AccountTypeOption {
    accountTypes.first { $0.id == accountKind } ?? accountTypes[0]
  }
  private var nameLabel: String {
    kind == .account
      ? "Account name"
      : kind == .goal ? "Goal name" : kind == .bill ? "Bill name" : "What was it for?"
  }
  private var subtitle: String {
    switch kind {
    case .account: return "Give your money a home."
    case .transaction: return "A small record. A clearer picture."
    case .budget: return "Choose a comfortable limit for this month."
    case .goal: return "Reserve money you already have for something ahead."
    case .bill: return "Know what’s coming before it arrives."
    }
  }
  private func save() {
    error = nil
    do {
      let value = try Money.normalizedInput(
        kind == .account && amount.isEmpty ? "0" : amount, currency: effectiveCurrency,
        allowNegative: kind == .account)
      let day = CalendarDay.string(date, zone: store.snapshot?.user.timeZone ?? "UTC")
      var body: [String: Any]
      let resource: String
      switch kind {
      case .account:
        resource = "accounts"
        body = [
          "name": name, "kind": accountKind, "currency": currency, "openingBalance": value,
          "openingDate": day, "idempotencyKey": idempotencyKey,
        ]
      case .transaction:
        resource = "transactions"
        body = [
          "accountId": accountID, "kind": transactionKind, "description": name,
          "category": category, "amount": value, "date": day, "idempotencyKey": idempotencyKey,
        ]
        if transactionKind == "transfer" {
          guard !toAccountID.isEmpty else {
            throw AppFailure.message("Choose a destination account in the same currency.")
          }
          body["toAccountId"] = toAccountID
        }
      case .budget:
        resource = "budgets"
        body = [
          "category": category, "currency": currency, "month": store.snapshot?.month ?? "",
          "amount": value,
        ]
      case .goal:
        resource = "goals"
        body = [
          "accountId": accountID, "name": name, "target": value,
          "reserved": try Money.normalizedInput(
            reserved.isEmpty ? "0" : reserved, currency: effectiveCurrency),
        ]
        if let goal { body["id"] = goal.id }
      case .bill:
        resource = "bills"
        body = [
          "accountId": accountID, "title": name, "category": category, "amount": value,
          "dueOn": day,
        ]
      }
      busy = true
      Task {
        do {
          try await store.mutate(resource, body: body, method: goal == nil ? "POST" : "PATCH")
          if kind == .account {
            withAnimation(reduceMotion ? nil : .spring(response: 0.32, dampingFraction: 0.84)) {
              accountSaved = true
            }
            try? await Task.sleep(for: .milliseconds(reduceMotion ? 100 : 520))
          }
          dismiss()
        } catch {
          self.error = error.localizedDescription
          busy = false
        }
      }
    } catch { self.error = error.localizedDescription }
  }
}

private struct AccountReveal: ViewModifier {
  let visible: Bool
  let delay: Double
  let reduceMotion: Bool

  func body(content: Content) -> some View {
    content
      .opacity(visible ? 1 : 0)
      .offset(y: visible || reduceMotion ? 0 : 12)
      .animation(
        reduceMotion ? nil : .easeOut(duration: 0.34).delay(delay),
        value: visible)
  }
}

private extension View {
  func accountReveal(_ visible: Bool, delay: Double, reduceMotion: Bool) -> some View {
    modifier(AccountReveal(visible: visible, delay: delay, reduceMotion: reduceMotion))
  }
}
