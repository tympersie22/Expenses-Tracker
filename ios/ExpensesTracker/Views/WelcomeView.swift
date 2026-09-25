import SwiftUI

enum AuthMode: String, Identifiable {
  case signup, login
  var id: String { rawValue }
}

struct WelcomeView: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var authMode: AuthMode?
  @State private var orbit = false
  var body: some View {
    GeometryReader { proxy in
      ScrollView {
        VStack(alignment: .leading, spacing: 28) {
          Brand().padding(.top, 12)
          ZStack {
            Circle().stroke(Well.accentInk.opacity(0.10), lineWidth: 1).frame(width: 244, height: 244)
            Circle().stroke(Well.accentInk.opacity(0.14), lineWidth: 1).frame(width: 194, height: 194)
            Circle().trim(from: 0.12, to: 0.9).stroke(
              Well.lime, style: StrokeStyle(lineWidth: 26, lineCap: .round)
            ).frame(width: 128, height: 128).rotationEffect(.degrees(orbit ? -60 : -90))
            Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 30, weight: .semibold)).foregroundStyle(
              Well.accentInk)
          }.frame(maxWidth: .infinity).frame(height: proxy.size.height < 700 ? 175 : 258)
            .scaleEffect(proxy.size.height < 700 ? 0.72 : 1).accessibilityHidden(true)
          VStack(alignment: .leading, spacing: 14) {
            Text("MONEY WITHOUT THE GUESSWORK").font(.caption.weight(.bold)).tracking(1.8)
              .foregroundStyle(Well.accentInk.opacity(0.72))
            Text("Know what you can spend.\nPlan what comes next.").font(Well.title(42)).tracking(-1.5)
              .foregroundStyle(Well.accentInk).fixedSize(horizontal: false, vertical: true)
            Text("Accounts, expenses, bills, and goals in one clear view—across the currencies you use.")
              .font(.body).foregroundStyle(Well.accentInk.opacity(0.72)).lineSpacing(4)
          }.arrive(0.1)
          Spacer(minLength: 0)
          VStack(spacing: 10) {
            Button { authMode = .signup } label: {
              HStack { Text("Get started").fontWeight(.semibold); Spacer(); Image(systemName: "arrow.right") }
                .padding(.horizontal, 22).frame(minHeight: 56).foregroundStyle(.white)
                .background(Well.accentInk, in: Capsule())
            }.buttonStyle(PressStyle())
            Button {
              authMode = .login
            } label: {
              Text("Already have an account? Sign in").font(.subheadline.weight(.semibold))
                .foregroundStyle(Well.accentInk).frame(maxWidth: .infinity).frame(minHeight: 48)
            }.accessibilityIdentifier("welcomeSignIn")
            Text("Your records stay private to your account.").font(.caption).foregroundStyle(
              Well.accentInk.opacity(0.56)
            ).padding(.bottom, 6)
          }.arrive(0.2)
          if let error = store.error { ErrorNotice(text: error) }
        }.padding(.horizontal, 28).frame(maxWidth: 520).frame(
          minHeight: max(0, proxy.size.height - 8)
        ).frame(maxWidth: .infinity)
      }.scrollIndicators(.hidden).background(Well.accent.ignoresSafeArea())
    }
    .onAppear { withAnimation(reduceMotion ? nil : .easeOut(duration: 1.5)) { orbit = true } }
    .sheet(item: $authMode, onDismiss: { store.completeAuthentication() }) { mode in
      AuthSheet(signup: mode == .signup).environmentObject(store).presentationDragIndicator(
        .visible
      ).presentationCornerRadius(32)
    }
  }
}
struct AuthSheet: View {
  @EnvironmentObject private var store: AppStore
  @Environment(\.dismiss) private var dismiss
  @State var signup: Bool
  @State private var name = ""
  @State private var email = ""
  @State private var password = ""
  @State private var currency = "USD"
  @State private var busy = false
  @State private var error: String?
  @State private var mfaRequired = false
  @State private var code = ""
  @State private var recoverySent = false
  @State private var acceptTerms = false
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          Text(signup ? "A fresh start.\nAll yours." : "Good to have\nyou back.").font(
            Well.title(39)
          ).tracking(-1).padding(.top, 16)
          Text(
            signup
              ? "Start with the money you have. Make a plan for what matters."
              : "Your accounts and plans are right where you left them."
          ).foregroundStyle(.secondary)
          VStack(spacing: 18) {
            if signup {
              LabeledInput(title: "Your name", text: $name).textContentType(.givenName)
                .accessibilityIdentifier("authName")
            }
            LabeledInput(title: "Email address", text: $email).textContentType(.username)
              .keyboardType(.emailAddress).textInputAutocapitalization(.never)
              .autocorrectionDisabled().accessibilityIdentifier("authEmail")
            VStack(alignment: .leading, spacing: 8) {
              Text("Password").font(.subheadline.weight(.medium))
              SecureField(signup ? "At least 12 characters" : "Your password", text: $password)
                .textContentType(signup ? .newPassword : .password).padding(16).background(
                  Well.card, in: RoundedRectangle(cornerRadius: 16)
                ).accessibilityIdentifier("authPassword")
            }
            if mfaRequired {
              LabeledInput(title: "Authenticator or recovery code", text: $code)
                .textContentType(.oneTimeCode).accessibilityIdentifier("authCode")
            }
            if signup {
              HStack {
                Text("Preferred currency")
                Spacer()
                Picker("Preferred currency", selection: $currency) {
                  ForEach(CurrencyData.codes, id: \.self) { Text($0).tag($0) }
                }
              }.padding(12).background(Well.card, in: RoundedRectangle(cornerRadius: 16))
              Toggle(isOn: $acceptTerms) {
                Text("I agree to the Terms and acknowledge the Privacy Policy.").font(.caption)
              }.accessibilityIdentifier("acceptTerms")
              HStack { Link("Terms", destination: AppLinks.url("terms")); Text("·"); Link("Privacy", destination: AppLinks.url("privacy")) }.font(.caption)
            }
          }
          if let error { ErrorNotice(text: error) }
          PrimaryButton(title: signup ? "Create account" : "Sign in", busy: busy) { submit() }
            .disabled(signup && !acceptTerms)
          if !signup {
            Button(recoverySent ? "Recovery email requested" : "Forgot your password?") {
              guard !email.isEmpty else { error = "Enter your email address first."; return }
              busy = true
              Task {
                defer { busy = false }
                do {
                  _ = try await store.api.request("api/auth/forgot-password", method: "POST", body: ["email": email])
                  recoverySent = true; error = "If this account can receive email, a secure recovery link is on its way."
                } catch { self.error = error.localizedDescription }
              }
            }.disabled(busy || recoverySent).frame(maxWidth: .infinity).frame(minHeight: 44)
          }
          Button(signup ? "Already have an account? Sign in" : "New here? Create an account") {
            signup.toggle()
            error = nil
          }.font(.subheadline).frame(maxWidth: .infinity).frame(minHeight: 44)
        }.padding(24).frame(maxWidth: 520).frame(maxWidth: .infinity)
      }.background(Well.paper).scrollDismissesKeyboard(.interactively)
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Close") { dismiss() } } }
    }.interactiveDismissDisabled(busy)
  }
  private func submit() {
    guard !busy else { return }
    busy = true
    error = nil
    Task {
      defer { busy = false }
      do {
        try await store.authenticate(
          signup: signup, name: name, email: email, password: password, currency: currency, code: mfaRequired ? code : nil, acceptTerms: acceptTerms)
        password = ""
        dismiss()
      } catch AppFailure.mfaRequired { mfaRequired = true; self.error = AppFailure.mfaRequired.localizedDescription }
      catch { self.error = error.localizedDescription }
    }
  }
}
struct LabeledInput: View {
  let title: String
  @Binding var text: String
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(LocalizedStringKey(title)).font(.subheadline.weight(.medium))
      TextField(title, text: $text).padding(16).background(
        Well.card, in: RoundedRectangle(cornerRadius: 16))
    }
  }
}
