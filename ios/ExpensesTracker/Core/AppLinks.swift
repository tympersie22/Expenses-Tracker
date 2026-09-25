import Foundation

enum AppLinks {
  static func url(_ path: String) -> URL {
    let configured = Bundle.main.object(forInfoDictionaryKey: "ExpensesTrackerPublicURL") as? String ?? ""
    return URL(string: configured)?.appendingPathComponent(path) ?? URL(string: "https://invalid.invalid")!
  }
}
