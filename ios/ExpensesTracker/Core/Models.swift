import Foundation

struct Snapshot: Codable {
  let user: Profile
  let today, month, horizon: String
  let accounts: [MoneyAccount]
  let summaries: [MoneySummary]
  let movements: [Movement]
  let bills: [Bill]
  let goals: [Goal]
  let budgets: [Budget]
  let recurring: [RecurringPattern]
  let forecast: [CashFlowForecast]
}
struct Profile: Codable {
  let id, email, baseCurrency, timeZone, language: String
  let firstName: String?
  let emailVerified, twoFactorEnabled: Bool
  var name: String { firstName ?? "You" }
}
struct AccountSession: Codable, Identifiable {
  let id: String
  let current: Bool
  let createdAt, lastSeenAt, expires: String
  let userAgent: String?
}
struct SessionEnvelope: Codable { let sessions: [AccountSession] }
struct MoneyAccount: Codable, Identifiable {
  let id, name, kind, currency, balance: String
  var icon: String {
    switch kind {
    case "cash": return "banknote"
    case "savings": return "leaf"
    case "mobile-money": return "iphone"
    case "wallet": return "wallet.bifold"
    default: return "building.columns"
    }
  }
}
struct MoneySummary: Codable {
  let currency, balance, reserved, bills, available, spent: String
}
struct Movement: Codable, Identifiable {
  let id, kind, description, category, date: String
  let billId: String?
  let entries: [Entry]
  var primary: Entry? { entries.first(where: { $0.amount.hasPrefix("-") }) ?? entries.first }
  var icon: String {
    kind == "transfer"
      ? "arrow.left.arrow.right"
      : kind == "income"
        ? "arrow.down.left" : kind == "opening" ? "building.columns" : categoryIcon(category)
  }
}
struct Entry: Codable { let accountId, accountName, currency, amount: String }
struct Bill: Codable, Identifiable {
  let id, accountId, accountName, currency, title, category, amount, dueOn: String
  let paid: Bool
}
struct Goal: Codable, Identifiable {
  let id, name, accountId, accountName, currency, target, reserved: String
}
struct Budget: Codable, Identifiable { let id, category, currency, month, limit, spent: String }
struct RecurringPattern: Codable, Identifiable {
  let id, accountId, accountName, currency, title, category, kind, cadence: String
  let typicalAmount, minimumAmount, maximumAmount: String
  let evidenceCount: Int
  let lastObservedOn, nextDueOn, status: String
}
struct CashFlowForecast: Codable {
  let currency, startBalance, endBalance, lowestBalance, lowestOn: String
  let points: [ForecastPoint]
}
struct ForecastPoint: Codable, Identifiable {
  let date, balance, change: String
  let events: [String]
  var id: String { date }
}
let categories = [
  "Food & groceries", "Transport", "Housing", "Utilities", "Shopping", "Health", "Entertainment",
  "Education", "Travel", "Income", "Other",
]
func categoryIcon(_ value: String) -> String {
  switch value {
  case "Food & groceries": return "basket"
  case "Transport": return "tram"
  case "Housing": return "house"
  case "Utilities": return "bolt"
  case "Shopping": return "bag"
  case "Health": return "heart"
  case "Entertainment": return "play.rectangle"
  case "Education": return "book"
  case "Travel": return "airplane"
  case "Income": return "arrow.down.left"
  default: return "circle.grid.2x2"
  }
}

/// Decimal is used end-to-end. Financial values never pass through Double.
enum Money {
  static func digits(_ currency: String) -> Int { CurrencyData.digits[currency] ?? 2 }
  static func decimal(_ minor: String, currency: String) -> Decimal {
    (Decimal(string: minor, locale: Locale(identifier: "en_US_POSIX")) ?? 0)
      / pow(Decimal(10), digits(currency))
  }
  static func format(_ minor: String, _ currency: String, hidden: Bool = false) -> String {
    if hidden { return "••••" }
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.currencyCode = currency
    f.minimumFractionDigits = digits(currency)
    f.maximumFractionDigits = digits(currency)
    return f.string(from: NSDecimalNumber(decimal: decimal(minor, currency: currency)))
      ?? "\(currency) \(minor)"
  }
  static func input(_ minor: String, currency: String) -> String {
    NSDecimalNumber(decimal: decimal(minor, currency: currency)).stringValue
  }
  static func normalizedInput(_ value: String, currency: String, allowNegative: Bool = false) throws
    -> String
  {
    let separator = Locale.current.decimalSeparator ?? "."
    let canonical = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(
      of: separator, with: ".")
    let pattern = allowNegative ? #"^-?\d+(\.\d+)?$"# : #"^\d+(\.\d+)?$"#
    guard canonical.range(of: pattern, options: .regularExpression) != nil,
      let number = Decimal(string: canonical, locale: Locale(identifier: "en_US_POSIX")),
      abs(number) * pow(Decimal(10), digits(currency)) <= Decimal(100_000_000_000_000),
      (canonical.split(separator: ".").dropFirst().first?.count ?? 0) <= digits(currency)
    else {
      throw AppFailure.message(
        "Enter an amount with up to \(digits(currency)) decimal places for \(currency).")
    }
    return canonical
  }
  static func fraction(_ numerator: String, _ denominator: String) -> Double {
    guard let a = Decimal(string: numerator), let b = Decimal(string: denominator), b > 0 else {
      return 0
    }
    // Double only for visual progress, never for balances or requests.
    return min(1, max(0, NSDecimalNumber(decimal: a / b).doubleValue))
  }
}
enum CalendarDay {
  static func string(_ date: Date, zone: String) -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(identifier: zone) ?? .gmt
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
  }
  static func date(_ day: String) -> Date {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = .gmt
    f.dateFormat = "yyyy-MM-dd"
    return f.date(from: day) ?? Date()
  }
  static func heading(_ day: String, locale: Locale = .current) -> String {
    let f = DateFormatter()
    f.timeZone = .gmt
    f.locale = locale
    f.setLocalizedDateFormatFromTemplate("EEEE MMMM d")
    return f.string(from: date(day))
  }
  static func label(_ day: String, locale: Locale = .current) -> String {
    let f = DateFormatter()
    f.timeZone = .gmt
    f.locale = locale
    f.setLocalizedDateFormatFromTemplate("MMM d")
    return f.string(from: date(day))
  }
}
