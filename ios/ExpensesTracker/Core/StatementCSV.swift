import Foundation

struct StatementRow: Identifiable {
  let id: Int
  let date, description, amount, type, category: String
  var payload: [String: String] {
    [
      "date": date, "description": description, "amount": amount, "type": type,
      "category": category,
    ]
  }
}
enum StatementCSV {
  private static func normalizedType(_ value: String) -> String? {
    switch value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
    case "expense", "debit", "withdrawal", "payment", "outflow", "dr": return "expense"
    case "income", "credit", "deposit", "inflow", "cr": return "income"
    default: return nil
    }
  }
  private static func normalizedCategory(_ value: String) -> String {
    let raw = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if let exact = categories.first(where: { $0.caseInsensitiveCompare(raw) == .orderedSame }) {
      return exact
    }
    let key = raw.lowercased()
    if ["food", "groceries", "grocery", "restaurant", "dining"].contains(key) { return "Food & groceries" }
    if ["transportation", "fuel", "taxi", "ride", "transit"].contains(key) { return "Transport" }
    if ["rent", "mortgage", "home"].contains(key) { return "Housing" }
    if ["bills", "electricity", "water", "internet", "airtime", "phone"].contains(key) { return "Utilities" }
    if ["medical", "pharmacy", "healthcare"].contains(key) { return "Health" }
    if ["salary", "payroll", "wages", "interest"].contains(key) { return "Income" }
    return "Other"
  }
  static func parse(_ text: String, currency: String) throws -> [StatementRow] {
    guard text.utf8.count <= 500_000 else {
      throw AppFailure.message("Choose a CSV smaller than 500 KB.")
    }
    var grid: [[String]] = []
    var row: [String] = []
    var cell = ""
    var quoted = false
    var closed = false
    let chars = Array(text.replacingOccurrences(of: "\u{FEFF}", with: ""))
    var i = 0
    while i < chars.count {
      let c = chars[i]
      if quoted {
        if c == "\"" {
          if i + 1 < chars.count && chars[i + 1] == "\"" {
            cell.append("\"")
            i += 1
          } else {
            quoted = false
            closed = true
          }
        } else {
          cell.append(c)
        }
      } else if c == "," {
        row.append(cell)
        cell = ""
        closed = false
      } else if c == "\n" || c == "\r" || c == "\r\n" {
        row.append(cell)
        if row.contains(where: { !$0.isEmpty }) { grid.append(row) }
        row = []
        cell = ""
        closed = false
        if c == "\r" && i + 1 < chars.count && chars[i + 1] == "\n" { i += 1 }
      } else if c == "\"" {
        guard cell.isEmpty && !closed else {
          throw AppFailure.message("The CSV has an unexpected quotation mark.")
        }
        quoted = true
      } else {
        guard !closed else {
          throw AppFailure.message("The CSV has characters after a closing quote.")
        }
        cell.append(c)
      }
      i += 1
    }
    guard !quoted else { throw AppFailure.message("The CSV has an unfinished quoted field.") }
    row.append(cell)
    if row.contains(where: { !$0.isEmpty }) { grid.append(row) }
    guard let header = grid.first?.map({ $0.trimmingCharacters(in: .whitespaces).lowercased() }),
      Set(header).count == header.count
    else { throw AppFailure.message("Use unique CSV column names.") }
    let required = ["date", "description", "amount", "type"]
    guard required.allSatisfy({ header.contains($0) }), grid.count > 1, grid.count <= 501 else {
      throw AppFailure.message(
        "Use date, description, amount, and type columns with 1–500 rows. Category is optional.")
    }
    return try grid.dropFirst().enumerated().map { index, fields in
      guard fields.count == header.count else {
        throw AppFailure.message("Row \(index + 2) has the wrong number of columns.")
      }
      let values = Dictionary(uniqueKeysWithValues: zip(header, fields))
      let date = (values["date"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
      let description = values["description"]?.trimmingCharacters(in: .whitespaces) ?? ""
      let rawType = values["type"] ?? ""
      let category = normalizedCategory(values["category"] ?? "")
      let f = DateFormatter()
      f.locale = Locale(identifier: "en_US_POSIX")
      f.calendar = Calendar(identifier: .gregorian)
      f.timeZone = .gmt
      f.dateFormat = "yyyy-MM-dd"
      f.isLenient = false
      guard let day = f.date(from: date), f.string(from: day) == date else {
        throw AppFailure.message("Row \(index + 2): use a date in YYYY-MM-DD format.")
      }
      guard !description.isEmpty, description.count <= 120 else {
        throw AppFailure.message("Row \(index + 2): description must contain 1–120 characters.")
      }
      guard let type = normalizedType(rawType) else {
        throw AppFailure.message("Row \(index + 2): type can be income, expense, credit, debit, deposit, or withdrawal.")
      }
      let rawAmount = (values["amount"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        .replacingOccurrences(of: ",", with: "")
      let amount = try Money.normalizedInput(rawAmount, currency: currency)
      guard (Decimal(string: amount) ?? 0) > 0 else {
        throw AppFailure.message("Row \(index + 2) needs a positive amount.")
      }
      return StatementRow(
        id: index, date: date, description: description, amount: amount, type: type,
        category: category)
    }
  }
}
