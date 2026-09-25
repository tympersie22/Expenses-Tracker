import SwiftUI

@MainActor final class AppStore: ObservableObject {
  @Published var snapshot: Snapshot?
  @Published var isStarting = true
  @Published var error: String?
  @Published var selectedCurrency = "USD"
  @Published var language = "en"
  @Published var hideAmounts = false
  @Published var successTick = 0
  @Published var lastSyncedAt: Date?
  @Published var isShowingCachedData = false
  let api = APIClient()
  private var refreshGeneration = 0
  private var pendingAuthentication: Snapshot?
  private struct CachedSnapshot: Codable {
    let sessionIdentity: String
    let savedAt: Date
    let snapshot: Snapshot
  }
  private var cacheURL: URL {
    FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("expenses-tracker-snapshot.json")
  }
  var summary: MoneySummary? {
    snapshot?.summaries.first(where: { $0.currency == selectedCurrency })
  }
  var accounts: [MoneyAccount] {
    snapshot?.accounts.filter { $0.currency == selectedCurrency } ?? []
  }
  func start() async {
    defer { isStarting = false }
    guard api.hasSession else { clearCache(); return }
    loadCache()
    await refresh()
  }
  func refresh() async {
    refreshGeneration += 1
    let generation = refreshGeneration
    do {
      let value = try await api.snapshot()
      guard generation == refreshGeneration else { return }
      if snapshot == nil || !value.summaries.contains(where: { $0.currency == selectedCurrency }) {
        selectedCurrency = value.user.baseCurrency
      }
      snapshot = value
      language = value.user.language
      lastSyncedAt = Date()
      isShowingCachedData = false
      saveCache(value)
      error = nil
    } catch AppFailure.signedOut {
      if generation == refreshGeneration {
        snapshot = nil
        clearCache()
        error = nil
      }
    } catch { if generation == refreshGeneration {
      self.error = snapshot == nil ? error.localizedDescription : "You’re offline. Showing your last synced records."
      isShowingCachedData = snapshot != nil
    } }
  }
  func authenticate(signup: Bool, name: String, email: String, password: String, currency: String, code: String? = nil, acceptTerms: Bool = false)
    async throws
  {
    var body: [String: Any] = ["email": email, "password": password]
    if let code, !code.isEmpty { body["code"] = code }
    if signup {
      body["name"] = name
      body["currency"] = currency
      body["timeZone"] = TimeZone.current.identifier
      body["acceptTerms"] = acceptTerms
    }
    let response = try await api.request("api/auth/\(signup ? "signup" : "login")", method: "POST", body: body)
    if let object = try? JSONSerialization.jsonObject(with: response) as? [String: Any], object["verificationRequired"] as? Bool == true {
      api.clearSession()
      throw AppFailure.verificationRequired
    }
    let value = try await api.snapshot()
    pendingAuthentication = value
    error = nil
  }
  // Replace the root only after the authentication sheet has finished dismissing.
  func completeAuthentication() {
    guard let value = pendingAuthentication else { return }
    pendingAuthentication = nil
    selectedCurrency = value.user.baseCurrency
    snapshot = value
    language = value.user.language
    lastSyncedAt = Date()
    isShowingCachedData = false
    saveCache(value)
    successTick += 1
  }
  @discardableResult
  func mutate(_ resource: String, body: [String: Any], method: String = "POST") async throws -> Data {
    let result: Data
    do {
      result = try await api.request("api/finance/\(resource)", method: method, body: body)
    } catch AppFailure.signedOut {
      snapshot = nil
      clearCache()
      throw AppFailure.signedOut
    }
    successTick += 1
    // A completed write stays completed even if refreshing fails; never encourage a duplicate submission.
    await refresh()
    return result
  }
  func logout() async throws {
    refreshGeneration += 1
    _ = try await api.request("api/auth/logout", method: "POST", body: [:])
    api.clearSession()
    snapshot = nil
    error = nil
    hideAmounts = false
    clearCache()
  }
  func clearLocalAccount() {
    refreshGeneration += 1
    pendingAuthentication = nil
    api.clearSession()
    snapshot = nil
    error = nil
    hideAmounts = false
    clearCache()
  }
  private func clearCache() {
    try? FileManager.default.removeItem(at: cacheURL)
    lastSyncedAt = nil
    isShowingCachedData = false
  }
  private func loadCache() {
    guard let data = try? Data(contentsOf: cacheURL),
      let cached = try? JSONDecoder().decode(CachedSnapshot.self, from: data),
      cached.sessionIdentity == api.cacheIdentity else { clearCache(); return }
    let value = cached.snapshot
    snapshot = value
    selectedCurrency = value.user.baseCurrency
    language = value.user.language
    lastSyncedAt = cached.savedAt
    isShowingCachedData = true
  }
  private func saveCache(_ value: Snapshot) {
    guard let identity = api.cacheIdentity,
      let data = try? JSONEncoder().encode(CachedSnapshot(sessionIdentity: identity, savedAt: Date(), snapshot: value)) else { return }
    do {
      try data.write(to: cacheURL, options: [.atomic, .completeFileProtection])
      try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: cacheURL.path)
    } catch {
      // A cache failure never changes the authoritative server result.
    }
  }
}
