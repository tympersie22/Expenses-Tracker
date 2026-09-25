import XCTest

final class ExpensesTrackerUITests: XCTestCase {
  @MainActor func testLoginPersistsSecureSession() async throws {
    continueAfterFailure = false
    let emailAddress = "ios-session-\(UUID().uuidString.lowercased())@example.test"
    try await createTestUser(email: emailAddress)
    let app = XCUIApplication()
    app.launchArguments = ["-resetSession"]
    app.launch()
    XCTAssertTrue(app.buttons["welcomeSignIn"].waitForExistence(timeout: 15))
    app.buttons["welcomeSignIn"].tap()
    let email = app.textFields["authEmail"]
    XCTAssertTrue(email.waitForExistence(timeout: 5))
    email.tap()
    email.typeText(emailAddress)
    let password = app.secureTextFields["authPassword"]
    password.tap()
    if app.buttons["GenerateStrongPasswordButton"].exists {
      app.buttons["xmark"].tap()
      password.tap()
    }
    password.typeText("Native-test-passphrase-2026")
    app.swipeUp()
    app.buttons["Sign in"].tap()
    XCTAssertTrue(app.buttons["tabToday"].waitForExistence(timeout: 20))
    app.terminate()
    app.launchArguments = []
    app.launch()
    XCTAssertTrue(app.buttons["tabToday"].waitForExistence(timeout: 15))
  }

  @MainActor func testRealAccountAndTransactionSurviveRelaunch() async throws {
    continueAfterFailure = true
    XCUIDevice.shared.orientation = .portrait
    let email = "ios-ui-\(UUID().uuidString.lowercased())@example.test"
    try await createTestUser(email: email)
    let app = XCUIApplication()
    app.launchArguments = ["-resetSession"]
    app.launch()
    if app.buttons["GenerateStrongPasswordButton"].exists { app.buttons["xmark"].tap() }
    XCTAssertTrue(app.buttons["welcomeSignIn"].waitForExistence(timeout: 15))
    app.buttons["welcomeSignIn"].tap()
    let emailField = app.textFields["authEmail"]
    XCTAssertTrue(emailField.waitForExistence(timeout: 5))
    emailField.tap()
    emailField.typeText(email)
    let password = app.secureTextFields["authPassword"]
    password.tap()
    if app.buttons["GenerateStrongPasswordButton"].exists {
      app.buttons["xmark"].tap()
      password.tap()
    }
    password.typeText("Native-test-passphrase-2026")
    app.swipeUp()
    app.buttons["Sign in"].tap()
    XCTAssertTrue(app.buttons["tabToday"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.buttons["quickAdd"].wait(for: \.isEnabled, toEqual: true, timeout: 10))
    app.buttons["quickAdd"].tap()
    if app.buttons["Record transaction"].waitForExistence(timeout: 3) {
      app.buttons["Record transaction"].tap()
    }
    let accountName = app.textFields["entryName"]
    XCTAssertTrue(accountName.waitForExistence(timeout: 5))
    accountName.tap()
    accountName.typeText("Everyday native")
    let balance = app.textFields["entryAmount"]
    accountName.typeText("\n")
    balance.typeText("1000")
    app.swipeUp()
    app.buttons["Save account"].tap()
    XCTAssertTrue(app.buttons["Save account"].waitForNonExistence(timeout: 15))
    XCTAssertTrue(app.buttons["quickAdd"].wait(for: \.isHittable, toEqual: true, timeout: 10))
    XCTAssertTrue(app.buttons["tabToday"].waitForExistence(timeout: 15))
    XCTAssertTrue(app.buttons["quickAdd"].wait(for: \.isEnabled, toEqual: true, timeout: 10))
    app.buttons["quickAdd"].tap()
    if app.buttons["Record transaction"].waitForExistence(timeout: 3) {
      app.buttons["Record transaction"].tap()
    }
    let description = app.textFields["entryName"]
    XCTAssertTrue(description.waitForExistence(timeout: 5))
    // Let the second SwiftUI sheet finish its reparenting animation before
    // assigning keyboard focus. A coordinate tap is reliable across iOS 17–26.
    try await Task.sleep(for: .seconds(1))
    description.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    description.typeText("Native groceries")
    let amount = app.textFields["entryAmount"]
    amount.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    amount.typeText("24.75")
    app.swipeUp()
    app.buttons["Save transaction"].tap()
    XCTAssertTrue(app.buttons["Save transaction"].waitForNonExistence(timeout: 15))
    XCTAssertTrue(app.buttons["tabActivity"].waitForExistence(timeout: 15))
    XCTAssertTrue(app.staticTexts["availableBalance"].label.contains("975.25"))
    app.buttons["tabActivity"].tap()
    XCTAssertTrue(app.staticTexts["Native groceries"].waitForExistence(timeout: 10))
    app.buttons["tabToday"].tap()
    try await Task.sleep(for: .seconds(2))
    let home = XCTAttachment(screenshot: app.screenshot())
    home.name = "Native home with verified balance"
    home.lifetime = .keepAlways
    add(home)
    app.terminate()
    app.launchArguments = []
    app.launch()
    XCTAssertTrue(app.buttons["tabActivity"].waitForExistence(timeout: 15))
    app.buttons["tabActivity"].tap()
    XCTAssertTrue(app.staticTexts["Native groceries"].waitForExistence(timeout: 10))
    try await Task.sleep(for: .seconds(1))
    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = "Native activity persisted"
    attachment.lifetime = .keepAlways
    add(attachment)
    app.buttons["settingsButton"].tap()
    app.swipeUp()
    app.swipeUp()
    app.buttons["signOut"].tap()
    XCTAssertTrue(app.buttons["Get started"].waitForExistence(timeout: 10))
  }

  private func createTestUser(email: String) async throws {
    var signup = URLRequest(url: URL(string: "http://localhost:3120/api/auth/signup")!)
    signup.httpMethod = "POST"
    signup.setValue("http://localhost:3120", forHTTPHeaderField: "Origin")
    signup.setValue("application/json", forHTTPHeaderField: "Content-Type")
    signup.httpBody = try JSONSerialization.data(withJSONObject: [
      "email": email, "password": "Native-test-passphrase-2026", "name": "Native Verification",
      "currency": "USD", "timeZone": "UTC", "acceptTerms": true,
    ])
    let (_, response) = try await URLSession.shared.data(for: signup)
    XCTAssertEqual((response as? HTTPURLResponse)?.statusCode, 201)
  }
}

extension ExpensesTrackerUITests {
  @MainActor func testReleaseScreenshots() async throws {
    continueAfterFailure = false
    for language in ["en", "sw"] {
      let email = "ios-screens-\(UUID().uuidString.lowercased())@example.test"
      var sessionCookie = ""
      func api(_ path: String, _ body: [String: Any]? = nil) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "http://localhost:3120/api/\(path)")!)
        request.httpMethod = body == nil ? "GET" : "POST"
        request.setValue("http://localhost:3120", forHTTPHeaderField: "Origin")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !sessionCookie.isEmpty { request.setValue(sessionCookie, forHTTPHeaderField: "Cookie") }
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body) }
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = response as! HTTPURLResponse
        XCTAssertTrue((200..<300).contains(http.statusCode), "Fixture API \(path) failed: \(http.statusCode)")
        if let cookie = http.value(forHTTPHeaderField: "Set-Cookie") { sessionCookie = String(cookie.split(separator: ";")[0]) }
        return try JSONSerialization.jsonObject(with: data) as! [String: Any]
      }
      _ = try await api("auth/signup", ["email": email, "password": "Screenshot-passphrase-2026", "name": "Amina", "currency": "USD", "timeZone": "UTC", "acceptTerms": true])
      _ = try await api("finance/settings", ["name": "Amina", "currency": "USD", "timeZone": "UTC", "language": language])
      let snapshot = try await api("finance/snapshot")
      let day = snapshot["today"] as! String
      let account = try await api("finance/accounts", ["name": language == "sw" ? "Matumizi ya kila siku" : "Everyday", "kind": "bank", "currency": "USD", "openingBalance": "2500", "openingDate": day, "idempotencyKey": UUID().uuidString])
      let id = account["id"] as! String
      _ = try await api("finance/transactions", ["accountId": id, "kind": "expense", "description": language == "sw" ? "Mahitaji ya nyumbani" : "Weekly groceries", "category": "Food & groceries", "amount": "64.50", "date": day, "idempotencyKey": UUID().uuidString])
      _ = try await api("finance/goals", ["accountId": id, "name": language == "sw" ? "Akiba ya dharura" : "Emergency fund", "target": "3000", "reserved": "500"])
      _ = try await api("finance/bills", ["accountId": id, "title": language == "sw" ? "Intaneti" : "Internet", "category": "Other", "amount": "45", "dueOn": day])
      _ = try await api("finance/budgets", ["currency": "USD", "category": "Food & groceries", "month": String(day.prefix(7)), "amount": "300"])
      let app = XCUIApplication()
      app.launchArguments = ["-resetSession"]
      app.launch()
      XCTAssertTrue(app.buttons["welcomeSignIn"].waitForExistence(timeout: 15))
      app.buttons["welcomeSignIn"].tap()
      let emailField = app.textFields["authEmail"]
      XCTAssertTrue(emailField.waitForExistence(timeout: 5))
      emailField.tap(); emailField.typeText(email)
      let password = app.secureTextFields["authPassword"]
      password.tap(); password.typeText("Screenshot-passphrase-2026")
      app.swipeUp(); app.buttons["Sign in"].tap()
      XCTAssertTrue(app.buttons["tabToday"].waitForExistence(timeout: 20))
      for (identifier, name) in [("tabToday", "home"), ("tabActivity", "activity"), ("tabPlan", "plans"), ("tabAccounts", "accounts")] {
        app.buttons[identifier].tap()
        try await Task.sleep(for: .seconds(2))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "store-\(language)-\(name)"; attachment.lifetime = .keepAlways; add(attachment)
      }
      app.buttons["settingsButton"].tap()
      try await Task.sleep(for: .seconds(2))
      let settings = XCTAttachment(screenshot: app.screenshot())
      settings.name = "store-\(language)-settings"; settings.lifetime = .keepAlways; add(settings)
      app.terminate()
      _ = try await api("auth/delete-account", ["password": "Screenshot-passphrase-2026", "confirmation": "DELETE MY ACCOUNT"])
    }
  }
}
