import SwiftUI

struct SettingsView: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  @State private var name = ""
  @State private var currency = "USD"
  @State private var zone = "UTC"
  @State private var language = "en"
  @State private var current = ""
  @State private var password = ""
  @State private var busy = false
  @State private var error: String?
  @State private var success: String?
  @State private var sessions: [AccountSession] = []
  @State private var mfaPassword = ""
  @State private var mfaCode = ""
  @State private var mfaSecret = ""
  @State private var recoveryCodes: [String] = []
  @State private var deletePassword = ""
  @State private var deleteConfirmation = ""
  @State private var exportURL: URL?
  @State private var confirmsDeletion = false
  var body: some View {
    NavigationStack {
      Form {
        Section {
          VStack(alignment: .leading, spacing: 10) {
            Text("Settings.").font(Well.title(34))
            Text(store.snapshot?.user.email ?? "").font(.subheadline).foregroundStyle(.secondary)
          }.padding(.vertical, 12).listRowBackground(Color.clear)
        }
        Section("Your preferences") {
          TextField("Name", text: $name)
          Picker("Preferred currency", selection: $currency) {
            ForEach(CurrencyData.codes, id: \.self) { Text($0).tag($0) }
          }
          Picker("Language", selection: $language) {
            Text("English").tag("en")
            Text("Kiswahili").tag("sw")
          }
          Picker("Time zone", selection: $zone) {
            ForEach(
              Array(Set(TimeZone.knownTimeZoneIdentifiers + [zone, "UTC"])).sorted(), id: \.self
            ) { Text($0.replacingOccurrences(of: "_", with: " ")).tag($0) }
          }
          Button("Save preferences") {
            run {
              try await store.mutate(
                "settings", body: ["name": name, "currency": currency, "timeZone": zone,
                                   "language": language])
              store.selectedCurrency = currency
              success = "Preferences saved."
            }
          }
          Toggle("Hide amounts", isOn: $store.hideAmounts)
        }
        Section {
          SecureField("Current password", text: $current).textContentType(.password)
          SecureField("New password", text: $password).textContentType(.newPassword)
          Button("Change password") {
            run {
              _ = try await store.api.request(
                "api/auth/password", method: "POST",
                body: ["current": current, "password": password])
              current = ""
              password = ""
              success = "Password changed. Other sessions have been signed out."
            }
          }
        } header: {
          Text("Security")
        } footer: {
          Text("At least 12 characters. Changing your password signs out your other sessions.")
        }
        Section("Email verification") {
          LabeledContent("Status", value: store.snapshot?.user.emailVerified == true ? "Verified" : "Not verified")
          if store.snapshot?.user.emailVerified == false {
            Button("Send verification email") {
              run {
                _ = try await store.api.request("api/auth/resend-verification", method: "POST", body: ["email": store.snapshot?.user.email ?? ""])
                success = "If this address can receive email, a secure link is on its way."
              }
            }
          }
        }
        Section("Two-factor authentication") {
          if store.snapshot?.user.twoFactorEnabled == true {
            SecureField("Current password", text: $mfaPassword)
            TextField("Six-digit code", text: $mfaCode).keyboardType(.numberPad).textContentType(.oneTimeCode)
            Button("Disable two-factor authentication", role: .destructive) {
              run {
                _ = try await store.api.request("api/auth/mfa-disable", method: "POST", body: ["password": mfaPassword, "code": mfaCode])
                mfaPassword = ""; mfaCode = ""; success = "Two-factor authentication is disabled."; await store.refresh()
              }
            }
          } else if mfaSecret.isEmpty {
            SecureField("Current password", text: $mfaPassword)
            Button("Set up authenticator") {
              run {
                let data = try await store.api.request("api/auth/mfa-setup", method: "POST", body: ["password": mfaPassword])
                mfaSecret = (try JSONSerialization.jsonObject(with: data) as? [String: String])?["secret"] ?? ""
              }
            }
          } else {
            Text("Add this secret to your authenticator app:")
            Text(mfaSecret).font(.caption.monospaced()).textSelection(.enabled)
            TextField("Six-digit code", text: $mfaCode).keyboardType(.numberPad).textContentType(.oneTimeCode)
            Button("Enable two-factor authentication") {
              run {
                let data = try await store.api.request("api/auth/mfa-enable", method: "POST", body: ["code": mfaCode])
                recoveryCodes = (try JSONSerialization.jsonObject(with: data) as? [String: Any])?["recoveryCodes"] as? [String] ?? []
                mfaPassword = ""; mfaCode = ""; mfaSecret = ""; success = "Two-factor authentication is enabled."; await store.refresh()
              }
            }
          }
          if !recoveryCodes.isEmpty {
            Text("Save these one-time recovery codes now. They will not be shown again.").font(.caption).foregroundStyle(.secondary)
            Text(recoveryCodes.joined(separator: "\n")).font(.caption.monospaced()).textSelection(.enabled)
          }
        }
        Section("Active sessions") {
          if sessions.isEmpty { Text("No sessions loaded.").foregroundStyle(.secondary) }
          ForEach(sessions) { session in
            VStack(alignment: .leading, spacing: 4) {
              Text(session.current ? "This device" : "Signed-in device").font(.headline)
              Text(session.userAgent ?? "Device details unavailable").font(.caption).foregroundStyle(.secondary).lineLimit(2)
              if !session.current { Button("Revoke", role: .destructive) {
                run {
                  _ = try await store.api.request("api/auth/revoke-session", method: "POST", body: ["id": session.id])
                  sessions.removeAll { $0.id == session.id }
                }
              } }
            }
          }
        }
        Section("Your data") {
          Button("Prepare full data archive", systemImage: "square.and.arrow.down") {
            run {
              let data = try await store.api.request("api/finance/full-export")
              let url = FileManager.default.temporaryDirectory.appendingPathComponent("expenses-tracker-full-export.json")
              try data.write(to: url, options: [.atomic, .completeFileProtection])
              exportURL = url
            }
          }
          if let exportURL { ShareLink(item: exportURL) { Label("Share full archive", systemImage: "square.and.arrow.up") } }
        }
        if let error { Section { ErrorNotice(text: error) } }
        if let success {
          Section { Label(success, systemImage: "checkmark.circle").foregroundStyle(Well.positive) }
        }
        Section {
          Button("Sign out", role: .destructive) {
            run {
              try await store.logout()
              dismiss()
            }
          }.accessibilityIdentifier("signOut")
        }
        Section("Delete account") {
          Text("This permanently removes your profile and financial records. Export your data first.").font(.caption).foregroundStyle(.secondary)
          SecureField("Current password", text: $deletePassword)
          TextField("Type DELETE MY ACCOUNT", text: $deleteConfirmation).textInputAutocapitalization(.characters)
          Button("Delete my account permanently", role: .destructive) { confirmsDeletion = true }
            .disabled(deleteConfirmation != "DELETE MY ACCOUNT" || deletePassword.isEmpty)
        }
        Section {
          Text(
            "Your records are stored on your server. Bank connections and live exchange rates are not enabled. Export records from Activity."
          ).font(.caption).foregroundStyle(.secondary)
        }
        Section("Connections & imports") {
          LabeledContent("Banks & cards", value: "Not connected")
          Text("Review statement transactions in the Financial inbox from Activity.")
            .font(.caption).foregroundStyle(.secondary)
          LabeledContent("Tanzania mobile money", value: "Not connected")
          Text("Carrier business payment APIs do not provide personal wallet history. Record transactions or review a statement in the Financial inbox.")
            .font(.caption).foregroundStyle(.secondary)
        }
        Section("Legal & support") {
          Link("Privacy", destination: AppLinks.url("privacy"))
          Link("Terms", destination: AppLinks.url("terms"))
          Link("Support", destination: AppLinks.url("support"))
        }
      }.disabled(busy).scrollContentBackground(.hidden).background(Well.paper)
        .toolbar {
          ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.disabled(busy) }
        }
        .onAppear {
          if let user = store.snapshot?.user {
            name = user.name
            currency = user.baseCurrency
            zone = user.timeZone
            language = user.language
          }
          Task { await loadSessions() }
        }
    }.interactiveDismissDisabled(busy)
      .confirmationDialog("Delete this account permanently?", isPresented: $confirmsDeletion, titleVisibility: .visible) {
        Button("Delete account", role: .destructive) {
          run {
            _ = try await store.api.request("api/auth/delete-account", method: "POST", body: ["password": deletePassword, "confirmation": deleteConfirmation])
            store.clearLocalAccount(); dismiss()
          }
        }
      } message: { Text("All financial records will be deleted and cannot be recovered.") }
  }
  private func run(_ action: @escaping () async throws -> Void) {
    busy = true
    error = nil
    success = nil
    Task {
      defer { busy = false }
      do { try await action() } catch { self.error = error.localizedDescription }
    }
  }
  private func loadSessions() async {
    do { sessions = try JSONDecoder().decode(SessionEnvelope.self, from: await store.api.request("api/auth/sessions")).sessions }
    catch { self.error = error.localizedDescription }
  }
}
