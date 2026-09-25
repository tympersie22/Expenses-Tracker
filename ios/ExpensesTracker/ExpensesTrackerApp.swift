import SwiftUI

@main struct ExpensesTrackerApp: App {
  @StateObject private var store = AppStore()
  @Environment(\.scenePhase) private var scenePhase
  init() { DiagnosticsReporter.shared.start() }
  var body: some Scene {
    WindowGroup {
      RootView().environmentObject(store).environment(\.locale, Locale(identifier: store.language)).tint(Well.positive)
        .overlay { if scenePhase != .active { Well.paper.ignoresSafeArea().overlay(Brand()) } }
    }
  }
}
struct RootView: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  var body: some View {
    Group {
      if store.isStarting {
        ZStack {
          Well.paper.ignoresSafeArea()
          VStack(spacing: 28) {
            Brand()
            ProgressView()
          }
        }
      } else if store.snapshot != nil {
        WorkspaceView().transition(.opacity)
      } else {
        WelcomeView().transition(.opacity)
      }
    }
    .animation(reduceMotion ? nil : .easeInOut(duration: 0.3), value: store.snapshot != nil)
    .task { await store.start() }
    .sensoryFeedback(.success, trigger: store.successTick)
  }
}
