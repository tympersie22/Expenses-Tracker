import SwiftUI

enum WellTab: String, CaseIterable {
  case today = "Today"
  case activity = "Activity"
  case plan = "Plan"
  case accounts = "Accounts"
  var icon: String {
    switch self {
    case .today: return "house"
    case .activity: return "arrow.left.arrow.right"
    case .plan: return "chart.bar"
    case .accounts: return "wallet.bifold"
    }
  }
}
enum EntryKind: String, Identifiable {
  case account, transaction, budget, goal, bill
  var id: String { rawValue }
  var title: String {
    switch self {
    case .account: return "Add an account"
    case .transaction: return "Record a transaction"
    case .budget: return "Set a budget"
    case .goal: return "Add a goal"
    case .bill: return "Plan a bill"
    }
  }
}
struct WorkspaceView: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.scenePhase) private var scenePhase
  @State private var tab: WellTab = .today
  @State private var entry: EntryKind?
  @State private var settings = false
  @State private var scanner = false
  @State private var scannedReceipt: ScannedReceipt?
  @State private var entryPresentationActive = false
  @Namespace private var navigation
  var body: some View {
    NavigationStack {
      ZStack(alignment: .bottom) {
        Well.paper.ignoresSafeArea()
        VStack(spacing: 0) {
          header.disabled(entryPresentationActive)
          ScrollView {
            VStack(alignment: .leading, spacing: 24) {
              if let error = store.error { ErrorNotice(text: "\(error) Pull down to retry.") }
              Group {
                switch tab {
                case .today: TodayView(entry: $entry, tab: $tab)
                case .activity: ActivityView()
                case .plan: PlanView(entry: $entry)
                case .accounts: AccountsView(entry: $entry)
                }
              }.id(tab).transition(.opacity.combined(with: .offset(y: reduceMotion ? 0 : 8)))
            }.padding(.horizontal, 22).padding(.top, 20).padding(.bottom, 28).frame(maxWidth: 700)
              .frame(maxWidth: .infinity)
          }.refreshable { await store.refresh() }.scrollIndicators(.hidden).disabled(
            entryPresentationActive)
        }
      }
      .safeAreaInset(edge: .bottom, spacing: 0) { dock.disabled(entryPresentationActive) }
      .toolbar(.hidden, for: .navigationBar)
      .sheet(item: $entry, onDismiss: {
        entryPresentationActive = false
        scannedReceipt = nil
      }) {
        EntrySheet(kind: $0, scannedReceipt: scannedReceipt).environmentObject(store).presentationDragIndicator(.visible)
          .presentationCornerRadius(30)
      }
      .sheet(isPresented: $scanner) {
        ReceiptScannerView { result in
          scannedReceipt = result
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { entry = .transaction }
        }.environmentObject(store).presentationDragIndicator(.visible).presentationCornerRadius(30)
      }
      .sheet(isPresented: $settings) {
        SettingsView().environmentObject(store).presentationDragIndicator(.visible)
          .presentationCornerRadius(30)
      }
    }
    .onChange(of: entry) { _, value in if value != nil { entryPresentationActive = true } }
    .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await store.refresh() } } }
    .sensoryFeedback(.selection, trigger: tab)
    .animation(reduceMotion ? nil : .spring(response: 0.38, dampingFraction: 0.85), value: tab)
    .animation(reduceMotion ? nil : .easeInOut(duration: 0.28), value: store.selectedCurrency)
  }
  private var header: some View {
    HStack {
      Brand()
      Spacer()
      Menu {
        ForEach(store.snapshot?.summaries.map(\.currency) ?? [], id: \.self) { currency in
          Button(currency) { store.selectedCurrency = currency }
        }
      } label: {
        HStack(spacing: 4) {
          Text(store.selectedCurrency).font(.caption.weight(.semibold))
          Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold))
        }.frame(minWidth: 52, minHeight: 44)
      }.accessibilityLabel("View currency")
      Button {
        settings = true
      } label: {
        Text(String(store.snapshot?.user.name.prefix(1) ?? "Y")).font(
          .subheadline.weight(.semibold)
        ).foregroundStyle(Well.accentInk).frame(width: 40, height: 40).background(
          Well.softAccent, in: Circle())
      }.frame(minWidth: 44, minHeight: 44).accessibilityLabel("Settings").accessibilityIdentifier(
        "settingsButton")
    }.padding(.horizontal, 22).padding(.vertical, 8).background(Well.paper)
  }
  private var dock: some View {
    HStack(spacing: 3) {
      ForEach(WellTab.allCases, id: \.self) { item in
        Button {
          tab = item
        } label: {
          VStack(spacing: 5) {
            Image(systemName: item.icon).font(
              .system(size: 19, weight: tab == item ? .semibold : .regular))
            Text(LocalizedStringKey(item.rawValue)).font(.system(size: 10, weight: .medium))
          }
          .foregroundStyle(tab == item ? Well.accentInk : .secondary).frame(maxWidth: .infinity).frame(
            height: 54
          )
          .background {
            if tab == item {
              Capsule().fill(Well.softAccent)
                .matchedGeometryEffect(id: "tab", in: navigation)
            }
          }
        }.buttonStyle(PressStyle()).accessibilityIdentifier("tab\(item.rawValue)")
          .accessibilityAddTraits(tab == item ? .isSelected : [])
      }
      Menu {
        Button("Record transaction", systemImage: "plus") {
          scannedReceipt = nil
          entry = (store.snapshot?.accounts.isEmpty ?? true) ? .account : .transaction
        }
        Button("Scan receipt or invoice", systemImage: "viewfinder") { scanner = true }
          .disabled(store.snapshot?.accounts.isEmpty ?? true)
      } label: {
        Image(systemName: "plus").font(.system(size: 21, weight: .medium)).foregroundStyle(
          Well.accentInk
        ).frame(width: 50, height: 50).background(Well.accent, in: Circle())
      }.buttonStyle(PressStyle()).padding(.leading, 5).accessibilityLabel("Add or scan transaction")
        .accessibilityIdentifier("quickAdd")
    }.padding(8).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 29)).overlay(
      RoundedRectangle(cornerRadius: 29).strokeBorder(.primary.opacity(0.06))
    ).padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 4)
  }
}
