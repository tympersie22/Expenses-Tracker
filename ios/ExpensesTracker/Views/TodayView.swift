import SwiftUI

struct TodayView: View {
  @EnvironmentObject private var store: AppStore
  @Binding var entry: EntryKind?
  @Binding var tab: WellTab
  @Environment(\.locale) private var locale
  @State private var explanation = false
  var body: some View {
    VStack(alignment: .leading, spacing: 24) {
      VStack(alignment: .leading, spacing: 7) {
        Text(
          CalendarDay.heading(store.snapshot?.today ?? CalendarDay.string(Date(), zone: "UTC"), locale: locale)
            .uppercased()
        ).font(.system(size: 10, weight: .semibold)).tracking(1.5).foregroundStyle(.secondary)
        Text(
          "Good to see you, \(store.snapshot?.user.name.components(separatedBy: " ").first ?? "there")."
        ).font(Well.title(33)).tracking(-1).fixedSize(horizontal: false, vertical: true)
      }.arrive()
      balanceCard.arrive(0.05)
      if store.snapshot?.accounts.isEmpty ?? true {
        EmptyCard(
          icon: "wallet.bifold", title: "Start with what you have.",
          detail:
            "Add a bank account, mobile wallet, or cash balance. Your picture comes together one account at a time.",
          action: "Add your first account"
        ) { entry = .account }.arrive(0.1)
      } else {
        HStack(spacing: 22) {
          quickAction("Record", icon: "plus") { entry = .transaction }
          quickAction("Set a goal", icon: "target") { entry = .goal }
          quickAction("Plan a bill", icon: "calendar") { entry = .bill }
          Spacer(minLength: 0)
        }.buttonStyle(PressStyle()).arrive(0.1)
        upcoming.arrive(0.15)
        recent.arrive(0.2)
      }
      Text("Your records stay private to your account.").font(.caption).foregroundStyle(
        .secondary
      ).frame(maxWidth: .infinity).padding(.top, 4)
    }
    .sheet(isPresented: $explanation) {
      explanationSheet.presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
    }
  }
  private var balanceCard: some View {
    VStack(alignment: .leading, spacing: 24) {
      HStack {
        HStack(spacing: 6) {
          Circle().fill(Well.accentInk).frame(width: 5, height: 5)
          Text("AVAILABLE TO SPEND").font(.system(size: 10, weight: .semibold)).tracking(1.6)
        }
        Spacer()
        Button {
          store.hideAmounts.toggle()
        } label: {
          Image(systemName: store.hideAmounts ? "eye.slash" : "eye").frame(width: 44, height: 36)
        }.accessibilityLabel(store.hideAmounts ? "Show amounts" : "Hide amounts")
      }.foregroundStyle(Well.accentInk.opacity(0.72))
      VStack(alignment: .leading, spacing: 8) {
        MoneyText(amount: store.summary?.available ?? "0", currency: store.selectedCurrency).font(
          .system(size: 44, weight: .semibold, design: .default)
        ).tracking(-1.5).minimumScaleFactor(0.5).lineLimit(1).accessibilityIdentifier(
          "availableBalance")
        Text(LocalizedStringKey(
          store.accounts.isEmpty
            ? "Add an account to calculate this." : "After your goals and upcoming bills."
        )).font(.subheadline).foregroundStyle(Well.accentInk.opacity(0.72))
      }
      Rectangle().fill(Well.accentInk.opacity(0.15)).frame(height: 1)
      HStack(alignment: .top, spacing: 12) {
        cardMetric("Balance", store.summary?.balance ?? "0")
        Spacer(minLength: 0)
        cardMetric("Set aside", store.summary?.reserved ?? "0")
        Spacer(minLength: 0)
        cardMetric("Bills · 14 days", store.summary?.bills ?? "0")
      }
      Button {
        explanation = true
      } label: {
        HStack {
          Text("A number you can understand")
          Spacer()
          Image(systemName: "arrow.up.right")
        }.font(.caption.weight(.semibold)).foregroundStyle(Well.accentInk).frame(minHeight: 30)
      }
    }.padding(24).foregroundStyle(Well.accentInk)
      .background(Well.accent, in: RoundedRectangle(cornerRadius: 30, style: .continuous))
  }
  private func cardMetric(_ label: String, _ value: String) -> some View {
    VStack(alignment: .leading, spacing: 7) {
      Text(LocalizedStringKey(label)).font(.system(size: 10)).foregroundStyle(Well.accentInk.opacity(0.64))
      MoneyText(amount: value, currency: store.selectedCurrency).font(
        .system(size: 13, weight: .medium)
      ).lineLimit(1).minimumScaleFactor(0.65)
    }
  }
  private func quickAction(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      VStack(spacing: 8) {
        Image(systemName: icon).font(.system(size: 18, weight: .semibold)).foregroundStyle(Well.accentInk)
          .frame(width: 48, height: 48).background(Well.softAccent, in: Circle())
        Text(LocalizedStringKey(title)).font(.caption.weight(.medium)).foregroundStyle(Well.ink).lineLimit(1)
      }
    }.frame(minWidth: 66, minHeight: 72)
  }
  private var upcoming: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionTitle(title: "On the horizon", action: "Your plan") { tab = .plan }
      let bills =
        store.snapshot?.bills.filter { !$0.paid && $0.currency == store.selectedCurrency } ?? []
      if let bill = bills.first {
        Panel {
          HStack(spacing: 14) {
            IconTile(symbol: categoryIcon(bill.category))
            VStack(alignment: .leading, spacing: 5) {
              Text(bill.title).font(.subheadline.weight(.semibold))
              Text("Due \(CalendarDay.label(bill.dueOn, locale: locale))").font(.caption).foregroundStyle(
                .secondary)
            }
            Spacer()
            MoneyText(amount: bill.amount, currency: bill.currency).font(
              .subheadline.weight(.semibold))
          }
        }
      } else {
        Panel {
          HStack(alignment: .top, spacing: 14) {
            IconTile(symbol: "sun.horizon")
            VStack(alignment: .leading, spacing: 6) {
              Text("No upcoming bills.").font(.subheadline.weight(.semibold))
              Text("Add upcoming bills to see what’s truly available.").font(.caption)
                .foregroundStyle(.secondary)
              Button("Plan a bill") { entry = .bill }.font(.caption.weight(.semibold)).frame(
                minHeight: 34)
            }
          }
        }
      }
    }
  }
  private var recent: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionTitle(title: "Recent activity", action: "View all") { tab = .activity }
      let moves =
        store.snapshot?.movements.filter {
          $0.entries.contains { $0.currency == store.selectedCurrency }
        } ?? []
      if moves.isEmpty {
        Text("Your next transaction will appear here.").font(.subheadline).foregroundStyle(
          .secondary)
      } else {
        Panel {
          VStack(spacing: 18) { ForEach(Array(moves.prefix(3))) { MovementRow(movement: $0) } }
        }
      }
    }
  }
  private var explanationSheet: some View {
    VStack(alignment: .leading, spacing: 24) {
      Text("How this number works.").font(Well.title(33))
      Text(
        "Available to spend = recorded balances − money reserved for goals − unpaid bills due within 14 days, including overdue bills."
      ).font(.body).foregroundStyle(.secondary)
      Text(
        "Each currency stays separate. This estimate uses your records; it doesn’t include unrecorded spending or bank activity."
      ).font(.subheadline).foregroundStyle(.secondary)
      Spacer()
    }.padding(28).padding(.top, 16).frame(maxWidth: .infinity, alignment: .leading).background(
      Well.paper)
  }
}
struct MovementRow: View {
  @Environment(\.locale) private var locale
  let movement: Movement
  var body: some View {
    HStack(spacing: 12) {
      IconTile(symbol: movement.icon)
      VStack(alignment: .leading, spacing: 5) {
        Text(movement.description).font(.subheadline.weight(.medium)).lineLimit(2)
        Text("\(movement.primary?.accountName ?? "") · \(CalendarDay.label(movement.date, locale: locale))").font(
          .caption
        ).foregroundStyle(.secondary)
      }
      Spacer(minLength: 4)
      if let e = movement.primary {
        MoneyText(amount: e.amount, currency: e.currency).font(.subheadline.weight(.medium))
          .foregroundStyle(movement.kind == "income" ? Well.positive : Well.ink).lineLimit(1)
          .minimumScaleFactor(0.75)
      }
    }.accessibilityElement(children: .combine)
  }
}
