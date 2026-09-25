import XCTest

@testable import ExpensesTracker

final class ExpensesTrackerTests: XCTestCase {
  func testExactCurrencyScaling() throws {
    XCTAssertEqual(Money.decimal("100001", currency: "USD"), Decimal(string: "1000.01"))
    XCTAssertEqual(Money.decimal("1250", currency: "JPY"), Decimal(1250))
    XCTAssertEqual(Money.decimal("123456", currency: "KWD"), Decimal(string: "123.456"))
    XCTAssertEqual(Money.decimal("-1", currency: "USD"), Decimal(string: "-0.01"))
    XCTAssertEqual(Money.input("100000000000000", currency: "USD"), "1000000000000")
    XCTAssertThrowsError(try Money.normalizedInput("1.001", currency: "USD"))
    XCTAssertThrowsError(try Money.normalizedInput("1.5", currency: "JPY"))
    XCTAssertThrowsError(try Money.normalizedInput("NaN", currency: "USD"))
    XCTAssertThrowsError(try Money.normalizedInput("-20", currency: "USD"))
    XCTAssertEqual(try Money.normalizedInput("-20", currency: "USD", allowNegative: true), "-20")
    XCTAssertTrue(CurrencyData.codes.contains("TZS"))
  }
  func testKeychainSessionRoundTrip() throws {
    let host = "test-keychain-\(UUID().uuidString)"
    defer { try? SessionVault.save(nil, host: host) }
    try SessionVault.save("test-token", host: host)
    XCTAssertEqual(SessionVault.read(host: host), "test-token")
    try SessionVault.save("rotated-token", host: host)
    XCTAssertEqual(SessionVault.read(host: host), "rotated-token")
    try SessionVault.save(nil, host: host)
    XCTAssertNil(SessionVault.read(host: host))
  }
  @MainActor func testOfflineCacheIdentityChangesWithSession() throws {
    let origin = URL(string: "https://cache-test-\(UUID().uuidString).invalid")!
    defer { try? SessionVault.save(nil, host: origin.absoluteString) }
    XCTAssertNil(APIClient(baseURL: origin).cacheIdentity)
    try SessionVault.save("first-session", host: origin.absoluteString)
    let first = APIClient(baseURL: origin).cacheIdentity
    XCTAssertNotNil(first)
    XCTAssertFalse(first!.contains("first-session"))
    try SessionVault.save("second-session", host: origin.absoluteString)
    let second = APIClient(baseURL: origin)
    XCTAssertNotEqual(first, second.cacheIdentity)
    second.clearSession()
    XCTAssertNil(second.cacheIdentity)
    XCTAssertNil(APIClient(baseURL: origin).cacheIdentity)
  }
  func testCalendarRespectsTimeZone() {
    let date = ISO8601DateFormatter().date(from: "2026-09-18T23:30:00Z")!
    XCTAssertEqual(CalendarDay.string(date, zone: "Africa/Dar_es_Salaam"), "2026-09-19")
    XCTAssertEqual(CalendarDay.string(date, zone: "America/New_York"), "2026-09-18")
  }
  func testCSVQuotesAndValidation() throws {
    let rows = try StatementCSV.parse(
      "\u{FEFF}date,description,amount,type\r\n2026-09-18,\"Coffee, bread\",12.50,expense\r\n",
      currency: "USD")
    XCTAssertEqual(rows.count, 1)
    XCTAssertEqual(rows[0].description, "Coffee, bread")
    XCTAssertEqual(rows[0].category, "Other")
    XCTAssertThrowsError(
      try StatementCSV.parse(
        "date,description,amount,type\n2026-02-30,Food,10,expense", currency: "USD"))
    XCTAssertThrowsError(
      try StatementCSV.parse(
        "date,description,amount,type\n2026-09-18,Food,10.5,expense", currency: "JPY"))
    XCTAssertThrowsError(
      try StatementCSV.parse(
        "date,description,amount,type\n2026-09-18,Food,-10,expense", currency: "USD"))
  }
  func testReceiptReviewFindsTotalWithoutRecordingIt() {
    let receipt = ReceiptReader.parse(
      "KARIBU MARKET\nDate 19/09/2026\nBread 2,500\nVAT 450\nJumla 2,950",
      currency: "TZS")
    XCTAssertEqual(receipt.merchant, "KARIBU MARKET")
    XCTAssertEqual(receipt.amount, "2950")
    XCTAssertNotNil(receipt.date)
  }
  @MainActor func testTransportErrorIsActionable() async {
    let api = APIClient(baseURL: URL(string: "http://untrusted.example")!)
    do {
      _ = try await api.snapshot()
      XCTFail("Insecure remote transport must be rejected")
    } catch { XCTAssertEqual(error.localizedDescription, "The server must use HTTPS.") }
  }
}
