import Foundation
import Security
import CryptoKit

enum AppFailure: LocalizedError {
  case message(String)
  case signedOut
  case mfaRequired
  case verificationRequired
  var errorDescription: String? {
    switch self {
    case .message(let text): return text
    case .signedOut: return "Your session has ended. Please sign in again."
    case .mfaRequired: return "Enter the code from your authenticator app."
    case .verificationRequired: return "Check your email and verify this account before signing in."
    }
  }
}
struct APIError: Decodable { let error: String; let mfaRequired: Bool? }

enum SessionVault {
  private static let service = "com.expensestracker.app.session"
  private static func failure(_ status: OSStatus) -> AppFailure {
    let detail = SecCopyErrorMessageString(status, nil) as String? ?? "status \(status)"
    return .message("Your session could not be stored securely (\(detail)).")
  }
  static func read(host: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
      kSecAttrAccount as String: host, kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]
    var result: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
      let data = result as? Data
    else { return nil }
    return String(data: data, encoding: .utf8)
  }
  static func save(_ token: String?, host: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
      kSecAttrAccount as String: host,
    ]
    if let token {
      let data = Data(token.utf8)
      let status = SecItemUpdate(
        query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
      if status == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        let addStatus = SecItemAdd(item as CFDictionary, nil)
        guard addStatus == errSecSuccess else { throw failure(addStatus) }
      } else if status != errSecSuccess {
        throw failure(status)
      }
    } else {
      SecItemDelete(query as CFDictionary)
    }
  }
}
final class NoRedirects: NSObject, URLSessionTaskDelegate {
  func urlSession(
    _ session: URLSession, task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) { completionHandler(nil) }
}
@MainActor final class APIClient {
  let baseURL: URL
  private let session: URLSession
  private var token: String?
  var hasSession: Bool { token != nil }
  var cacheIdentity: String? {
    guard let token else { return nil }
    return SHA256.hash(data: Data((baseURL.absoluteString + ":" + token).utf8))
      .map { String(format: "%02x", $0) }.joined()
  }
  init(baseURL: URL? = nil) {
    #if targetEnvironment(simulator) && DEBUG
      let configured = "http://localhost:3120"
    #else
      let configured = Bundle.main.object(forInfoDictionaryKey: "ExpensesTrackerAPIURL") as? String ?? ""
    #endif
    self.baseURL = baseURL ?? URL(string: configured) ?? URL(string: "https://invalid.invalid")!
    #if DEBUG
    if ProcessInfo.processInfo.arguments.contains("-resetSession") {
      try? SessionVault.save(nil, host: self.baseURL.absoluteString)
    }
    #endif
    token = SessionVault.read(host: self.baseURL.absoluteString)
    let config = URLSessionConfiguration.ephemeral
    config.httpShouldSetCookies = false
    config.httpCookieStorage = nil
    config.urlCache = nil
    config.requestCachePolicy = .reloadIgnoringLocalCacheData
    config.timeoutIntervalForRequest = 20
    session = URLSession(configuration: config, delegate: NoRedirects(), delegateQueue: nil)
  }
  func clearSession() {
    token = nil
    try? SessionVault.save(nil, host: baseURL.absoluteString)
  }
  func request(
    _ path: String, method: String = "GET", body: [String: Any]? = nil,
    query: [URLQueryItem] = []
  ) async throws
    -> Data
  {
    guard baseURL.host != "invalid.invalid" else {
      throw AppFailure.message("This build is missing its Expenses Tracker server configuration.")
    }
    guard
      baseURL.scheme == "https"
        || (baseURL.scheme == "http" && ["localhost", "127.0.0.1"].contains(baseURL.host ?? ""))
    else { throw AppFailure.message("The server must use HTTPS.") }
    var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
    if !query.isEmpty { components.queryItems = query }
    var req = URLRequest(url: components.url!)
    req.httpMethod = method
    req.setValue("application/json", forHTTPHeaderField: "Accept")
    var origin = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
    origin.path = ""; origin.query = nil; origin.fragment = nil
    req.setValue(origin.string, forHTTPHeaderField: "Origin")
    if let token { req.setValue("expenses_tracker_session=\(token)", forHTTPHeaderField: "Cookie") }
    if let body {
      req.httpBody = try JSONSerialization.data(withJSONObject: body)
      req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    }
    let data: Data
    let response: URLResponse
    do { (data, response) = try await session.data(for: req) } catch {
      throw AppFailure.message(
        "We couldn’t reach your server. Check your connection and try again.")
    }
    guard let http = response as? HTTPURLResponse else {
      throw AppFailure.message("The server returned an invalid response.")
    }
    guard (200..<300).contains(http.statusCode) else {
      if http.statusCode == 401 && !path.contains("auth/login") {
        clearSession()
        throw AppFailure.signedOut
      }
      if let response = try? JSONDecoder().decode(APIError.self, from: data), response.mfaRequired == true {
        throw AppFailure.mfaRequired
      }
      throw AppFailure.message((try? JSONDecoder().decode(APIError.self, from: data).error)
        ?? "We couldn’t complete that request. Please try again.")
    }
    if let header = http.value(forHTTPHeaderField: "Set-Cookie"), let url = http.url,
      let cookie = HTTPCookie.cookies(withResponseHeaderFields: ["Set-Cookie": header], for: url)
        .first(where: { $0.name == "expenses_tracker_session" })
    {
      let value = cookie.value.isEmpty ? nil : cookie.value
      try SessionVault.save(value, host: baseURL.absoluteString)
      token = value
    }
    return data
  }
  func snapshot() async throws -> Snapshot {
    try JSONDecoder().decode(Snapshot.self, from: await request("api/finance/snapshot"))
  }
}
