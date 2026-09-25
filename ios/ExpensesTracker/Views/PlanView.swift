import SwiftUI

struct PlanView: View {
  @Environment(\.locale) private var locale
  @EnvironmentObject private var store: AppStore
  @Binding var entry: EntryKind?
  @State private var section = "Outlook"
  @State private var editGoal: Goal?
  @State private var confirmation: PlanAction?
  @State private var busy = false
  @State private var error: String?
  @State private var notice: String?
  var body: some View {
    VStack(alignment: .leading, spacing: 22) {
      Text("Plan what comes next.").font(Well.title(34)).tracking(-1)
      Text("Set goals, control spending, and prepare for upcoming bills.").font(.subheadline).foregroundStyle(.secondary)
      Picker("Plan section", selection: $section) {
        ForEach(["Outlook", "Goals", "Budgets", "Bills"], id: \.self) { Text(LocalizedStringKey($0)).tag($0) }
      }.pickerStyle(.segmented)
      if let error { ErrorNotice(text: error) }
      if let notice {
        Label(notice, systemImage: "checkmark.circle")
          .font(.subheadline).padding(14).frame(maxWidth: .infinity, alignment: .leading)
          .background(Well.softAccent, in: RoundedRectangle(cornerRadius: 16))
      }
      if section == "Outlook" { outlook } else if section == "Goals" { goals } else if section == "Budgets" { budgets } else { bills }
    }.arrive()
      .sheet(item: $editGoal) { goal in
        EntrySheet(kind: .goal, goal: goal).environmentObject(store).presentationDragIndicator(
          .visible)
      }
      .confirmationDialog(
        confirmation?.title ?? "",
        isPresented: Binding(get: { confirmation != nil }, set: { if !$0 { confirmation = nil } }),
        presenting: confirmation
      ) { action in
        Button(action.title, role: action.remove ? .destructive : nil) { perform(action) }
      } message: { action in
        Text(
          action.remove
            ? "This removes the plan and releases its reservation. Recorded transactions remain."
            : "Record this bill as an expense in its account. This does not send a payment.")
      }
  }
  private var outlook: some View {
    VStack(spacing: 18) {
      if let forecast = store.snapshot?.forecast.first(where: { $0.currency == store.selectedCurrency }) {
        forecastCard(forecast)
      }
      HStack(alignment: .bottom) {
        VStack(alignment: .leading, spacing: 4) {
          Text("RECURRING INTELLIGENCE").font(.caption2.weight(.bold)).tracking(1.4).foregroundStyle(.secondary)
          Text("Money with a rhythm").font(Well.title(25))
        }
        Spacer()
        Button("Check history") { scanRecurring() }.font(.subheadline.weight(.semibold)).disabled(busy)
      }
      let patterns = store.snapshot?.recurring.filter { $0.currency == store.selectedCurrency } ?? []
      if patterns.isEmpty {
        EmptyCard(icon: "repeat", title: "Find what repeats.", detail: "Check your confirmed history for weekly and monthly patterns. Nothing changes your forecast until you approve it.")
      }
      ForEach(patterns) { pattern in recurringCard(pattern) }
    }
  }
  private func forecastCard(_ forecast: CashFlowForecast) -> some View {
    Panel(background: Well.deep) {
      VStack(alignment: .leading, spacing: 20) {
        Text("30-DAY OUTLOOK · \(forecast.currency)").font(.caption2.weight(.bold)).tracking(1.5).foregroundStyle(Well.accent)
        MoneyText(amount: forecast.endBalance, currency: forecast.currency)
          .font(Well.title(40)).foregroundStyle(Well.accent)
        Text("Projected after confirmed recurring money and planned bills.").font(.subheadline).foregroundStyle(.white.opacity(0.68))
        ForecastLine(points: forecast.points, currency: forecast.currency, hidden: store.hideAmounts)
          .frame(height: 120)
        HStack {
          VStack(alignment: .leading, spacing: 5) {
            Text("LOWEST POINT").font(.caption2).foregroundStyle(.white.opacity(0.55))
            MoneyText(amount: forecast.lowestBalance, currency: forecast.currency).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
          }
          Spacer()
          VStack(alignment: .trailing, spacing: 5) {
            Text("AROUND").font(.caption2).foregroundStyle(.white.opacity(0.55))
            Text(CalendarDay.label(forecast.lowestOn, locale: locale)).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
          }
        }
        let events = forecast.points.filter { !$0.events.isEmpty }
        if events.isEmpty {
          Text("No confirmed changes in the next 30 days.").font(.caption).foregroundStyle(.white.opacity(0.6))
        } else {
          ForEach(events.prefix(4)) { point in
            HStack {
              Text(CalendarDay.label(point.date, locale: locale)).foregroundStyle(.white.opacity(0.6))
              Text(point.events.joined(separator: ", ")).lineLimit(1)
              Spacer()
              MoneyText(amount: point.change, currency: forecast.currency)
            }.font(.caption).foregroundStyle(.white)
          }
        }
      }
    }
  }
  private func recurringCard(_ pattern: RecurringPattern) -> some View {
    Panel {
      VStack(alignment: .leading, spacing: 14) {
        HStack(alignment: .top) {
          VStack(alignment: .leading, spacing: 5) {
            Text(pattern.status == "active" ? "CONFIRMED" : "SUGGESTION").font(.caption2.weight(.bold)).tracking(1.3).foregroundStyle(.secondary)
            Text(pattern.title).font(.headline)
          }
          Spacer()
          MoneyText(amount: pattern.typicalAmount, currency: pattern.currency).font(.headline)
        }
        Text("\(pattern.cadence.capitalized) · next around \(CalendarDay.label(pattern.nextDueOn, locale: locale)) · \(pattern.evidenceCount) records")
          .font(.caption).foregroundStyle(.secondary)
        if pattern.minimumAmount != pattern.maximumAmount {
          Text("Observed range: \(Money.format(pattern.minimumAmount, pattern.currency, hidden: store.hideAmounts))–\(Money.format(pattern.maximumAmount, pattern.currency, hidden: store.hideAmounts))")
            .font(.caption).foregroundStyle(.secondary)
        }
        if pattern.status == "suggested" {
          HStack(spacing: 12) {
            Button("Use in forecast") { decide(pattern, action: "confirm") }.buttonStyle(.borderedProminent).tint(Well.accent).foregroundStyle(Well.deep)
            Button("Not recurring") { decide(pattern, action: "dismiss") }.buttonStyle(.borderless).foregroundStyle(.secondary)
          }.disabled(busy)
        }
      }
    }
  }
  private var goals: some View {
    VStack(spacing: 16) {
      let rows = store.snapshot?.goals.filter { $0.currency == store.selectedCurrency } ?? []
      if rows.isEmpty {
        EmptyCard(
          icon: "leaf", title: "What are you making room for?",
          detail:
            "A trip, a quiet buffer, a new beginning. Reserve real money from an account toward your goal."
        )
      }
      ForEach(rows) { goal in
        Panel {
          VStack(alignment: .leading, spacing: 18) {
            HStack {
              IconTile(symbol: "leaf")
              Spacer()
              Menu {
                Button("Adjust reservation") { editGoal = goal }
                Button("Remove goal", role: .destructive) {
                  confirmation = PlanAction(
                    resource: "goals", id: goal.id, title: "Remove goal", remove: true)
                }
              } label: {
                Image(systemName: "ellipsis").frame(width: 44, height: 44)
              }
            }
            Text(goal.name).font(Well.title(26))
            HStack(alignment: .firstTextBaseline) {
              MoneyText(amount: goal.reserved, currency: goal.currency).font(
                .title3.weight(.semibold))
              Text("of \(Money.format(goal.target, goal.currency, hidden: store.hideAmounts))")
                .font(.caption).foregroundStyle(.secondary)
            }
            ProgressTrack(value: Money.fraction(goal.reserved, goal.target))
            Text("Reserved in \(goal.accountName)").font(.caption).foregroundStyle(.secondary)
          }
        }
      }
      PrimaryButton(title: "Add a goal", icon: "plus") { entry = .goal }
    }
  }
  private var budgets: some View {
    VStack(spacing: 16) {
      let rows = store.snapshot?.budgets.filter { $0.currency == store.selectedCurrency } ?? []
      if rows.isEmpty {
        EmptyCard(
          icon: "chart.bar", title: "A rhythm for this month.",
          detail:
            "Choose a category and a spending limit. Your recorded expenses fill in the picture.")
      }
      ForEach(rows) { budget in
        Panel {
          VStack(alignment: .leading, spacing: 16) {
            HStack {
              IconTile(symbol: categoryIcon(budget.category))
              Text(budget.category).font(.headline)
              Spacer()
              Menu {
                Button("Remove budget", role: .destructive) {
                  confirmation = PlanAction(
                    resource: "budgets", id: budget.id, title: "Remove budget", remove: true)
                }
              } label: {
                Image(systemName: "ellipsis").frame(width: 44, height: 44)
              }
            }
            HStack {
              MoneyText(amount: budget.spent, currency: budget.currency).font(
                .title3.weight(.semibold))
              Spacer()
              Text("of \(Money.format(budget.limit, budget.currency, hidden: store.hideAmounts))")
                .font(.caption).foregroundStyle(.secondary)
            }
            ProgressTrack(
              value: Money.fraction(budget.spent, budget.limit),
              color: Money.fraction(budget.spent, budget.limit) >= 1 ? Well.amber : Well.accent)
            Text("Monthly budget · \(budget.month)").font(.caption).foregroundStyle(.secondary)
          }
        }
      }
      PrimaryButton(title: "Set a budget", icon: "plus") { entry = .budget }
      Text("Setting the same category again updates its limit for this month.").font(.caption)
        .foregroundStyle(.secondary)
    }
  }
  private var bills: some View {
    VStack(spacing: 16) {
      let rows = store.snapshot?.bills.filter { $0.currency == store.selectedCurrency } ?? []
      if rows.isEmpty {
        EmptyCard(
          icon: "calendar", title: "Meet tomorrow, prepared.",
          detail:
            "Keep upcoming bills in view. Bills due within 14 days reduce your available-to-spend estimate."
        )
      }
      ForEach(rows) { bill in
        Panel {
          VStack(alignment: .leading, spacing: 16) {
            HStack {
              IconTile(symbol: bill.paid ? "checkmark" : categoryIcon(bill.category))
              VStack(alignment: .leading, spacing: 5) {
                Text(bill.title).font(.headline)
                Text(
                  "\(bill.paid ? "Recorded as paid" : "Due \(CalendarDay.label(bill.dueOn, locale: locale))") · \(bill.accountName)"
                ).font(.caption).foregroundStyle(.secondary)
              }
              Spacer()
            }
            MoneyText(amount: bill.amount, currency: bill.currency).font(Well.title(29))
            if !bill.paid {
              HStack {
                Button("Record as paid") {
                  confirmation = PlanAction(
                    resource: "pay-bill", id: bill.id, title: "Record as paid", remove: false)
                }.font(.subheadline.weight(.semibold))
                Spacer()
                Button("Remove", role: .destructive) {
                  confirmation = PlanAction(
                    resource: "bills", id: bill.id, title: "Remove bill", remove: true)
                }.font(.caption)
              }.frame(minHeight: 44).disabled(busy)
            }
          }
        }
      }
      PrimaryButton(title: "Plan a bill", icon: "plus") { entry = .bill }
    }
  }
  private func perform(_ action: PlanAction) {
    busy = true
    error = nil
    Task {
      defer { busy = false }
      do {
        var body: [String: Any] = ["id": action.id]
        if !action.remove { body["idempotencyKey"] = UUID().uuidString }
        try await store.mutate(
          action.resource, body: body, method: action.remove ? "DELETE" : "POST")
      } catch { self.error = error.localizedDescription }
    }
  }
  private func scanRecurring() {
    busy = true; error = nil; notice = nil
    Task {
      defer { busy = false }
      do {
        let data = try await store.mutate("recurring", body: [:])
        let result = try JSONDecoder().decode(RecurringScanResult.self, from: data)
        notice = result.found == 0
          ? "No recurring pattern yet. Add at least three weekly or monthly transactions with the same description, then check again."
          : "Reviewed your history and found \(result.found) recurring pattern\(result.found == 1 ? "" : "s")."
      }
      catch { self.error = error.localizedDescription }
    }
  }
  private func decide(_ pattern: RecurringPattern, action: String) {
    busy = true; error = nil
    Task {
      defer { busy = false }
      do { try await store.mutate("recurring", body: ["id": pattern.id, "action": action], method: "PATCH") }
      catch { self.error = error.localizedDescription }
    }
  }
}

private struct RecurringScanResult: Decodable { let found: Int }

private struct ForecastLine: View {
  let points: [ForecastPoint]
  let currency: String
  let hidden: Bool
  var body: some View {
    GeometryReader { proxy in
      let values = hidden ? points.map { _ in 1.0 } : points.map { NSDecimalNumber(decimal: Money.decimal($0.balance, currency: currency)).doubleValue }
      let low = values.min() ?? 0, high = values.max() ?? 1, range = max(high - low, 1)
      Path { path in
        for index in values.indices {
          let x = proxy.size.width * CGFloat(index) / CGFloat(max(values.count - 1, 1))
          let y = proxy.size.height - (proxy.size.height * 0.78 * CGFloat((values[index] - low) / range) + proxy.size.height * 0.11)
          if index == values.startIndex { path.move(to: CGPoint(x: x, y: y)) } else { path.addLine(to: CGPoint(x: x, y: y)) }
        }
      }.stroke(Well.accent, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
    }
  }
}
struct PlanAction: Identifiable {
  let resource, id, title: String
  let remove: Bool
}
