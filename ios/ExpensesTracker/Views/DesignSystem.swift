import SwiftUI

enum Well {
  static let forest = Color(red: 0.086, green: 0.200, blue: 0.000)
  static let deep = Color(red: 0.035, green: 0.106, blue: 0.047)
  static let lime = Color(red: 0.624, green: 0.910, blue: 0.439)
  static let paper = Color(
    uiColor: UIColor {
      $0.userInterfaceStyle == .dark
        ? UIColor(red: 0.035, green: 0.063, blue: 0.043, alpha: 1)
        : UIColor(red: 0.969, green: 0.973, blue: 0.949, alpha: 1)
    })
  static let card = Color(uiColor: .secondarySystemGroupedBackground)
  static let ink = Color.primary
  static let secondary = Color.secondary
  static let accent = Color(red: 0.624, green: 0.910, blue: 0.439)
  static let accentInk = Color(red: 0.035, green: 0.106, blue: 0.047)
  static let positive = Color(
    uiColor: UIColor {
      $0.userInterfaceStyle == .dark
        ? UIColor(red: 0.624, green: 0.910, blue: 0.439, alpha: 1)
        : UIColor(red: 0.070, green: 0.330, blue: 0.090, alpha: 1)
    })
  static let softAccent = Color(red: 0.878, green: 0.957, blue: 0.800)
  static let amber = accent
  static func title(_ size: CGFloat) -> Font {
    .system(size: size, weight: .semibold, design: .default)
  }
}
struct Brand: View {
  var light = false
  var body: some View {
    HStack(spacing: 9) {
      ZStack {
        RoundedRectangle(cornerRadius: 5, style: .continuous).fill(light ? Color.white : Well.accent)
        Image(systemName: "arrow.up.right").font(.system(size: 13, weight: .black))
          .foregroundStyle(Well.accentInk)
      }.frame(width: 25, height: 25)
      Text("Expenses Tracker").font(Well.title(24)).foregroundStyle(light ? .white : Well.ink)
    }.accessibilityElement(children: .ignore).accessibilityLabel("Expenses Tracker")
  }
}
struct PressStyle: ButtonStyle {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  func makeBody(configuration: Configuration) -> some View {
    configuration.label.opacity(configuration.isPressed ? 0.76 : 1).scaleEffect(
      configuration.isPressed && !reduceMotion ? 0.97 : 1
    )
    .animation(
      reduceMotion ? nil : .spring(response: 0.28, dampingFraction: 0.7),
      value: configuration.isPressed)
  }
}
struct PrimaryButton: View {
  let title: String
  var busy = false
  var icon = "arrow.right"
  var inverted = false
  let action: () -> Void
  var body: some View {
    Button(action: action) {
      HStack {
      Text(LocalizedStringKey(title)).fontWeight(.semibold)
        Spacer()
        if busy { ProgressView().tint(inverted ? .black : Well.paper) } else { Image(systemName: icon) }
      }
      .padding(.horizontal, 22).frame(minHeight: 56)
      .foregroundStyle(Well.accentInk)
      .background(inverted ? Color.white : Well.accent, in: Capsule())
    }.buttonStyle(PressStyle()).disabled(busy).accessibilityIdentifier(title)
  }
}
struct Panel<Content: View>: View {
  let background: Color
  @ViewBuilder let content: Content
  init(background: Color = Well.card, @ViewBuilder content: () -> Content) {
    self.background = background
    self.content = content()
  }
  var body: some View {
    content.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(
      background, in: RoundedRectangle(cornerRadius: 24, style: .continuous)
    ).overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(.primary.opacity(0.05)))
  }
}
struct SectionTitle: View {
  let title: LocalizedStringKey
  var action: String? = nil
  var onTap: (() -> Void)? = nil
  var body: some View {
    HStack {
      Text(title).font(.title3.weight(.semibold))
      Spacer()
      if let action, let onTap {
        Button(LocalizedStringKey(action), action: onTap).font(.subheadline.weight(.semibold)).foregroundStyle(
          Well.positive
        ).frame(minHeight: 44)
      }
    }
  }
}
struct IconTile: View {
  let symbol: String
  var tint: Color = Well.accent
  var body: some View {
    Image(systemName: symbol).font(.system(size: 18, weight: .semibold)).foregroundStyle(Well.accentInk).frame(
      width: 46, height: 46
    ).background(Well.softAccent, in: Circle()).accessibilityHidden(
      true)
  }
}
struct EmptyCard: View {
  let icon: String
  let title, detail: LocalizedStringKey
  var action: String? = nil
  var onTap: (() -> Void)? = nil
  var body: some View {
    Panel {
      VStack(alignment: .leading, spacing: 14) {
        IconTile(symbol: icon)
        Text(title).font(Well.title(25))
        Text(detail).font(.subheadline).foregroundStyle(.secondary).fixedSize(
          horizontal: false, vertical: true)
        if let action, let onTap {
          Button(LocalizedStringKey(action), action: onTap).font(.subheadline.weight(.semibold)).foregroundStyle(
            Well.positive
          ).frame(minHeight: 44)
        }
      }
    }
  }
}
struct ErrorNotice: View {
  let text: String
  var body: some View {
    Label(text, systemImage: "exclamationmark.circle").font(.subheadline).foregroundStyle(.red)
      .padding(14).frame(maxWidth: .infinity, alignment: .leading).background(
        .red.opacity(0.07), in: RoundedRectangle(cornerRadius: 16)
      ).accessibilityIdentifier("errorNotice")
  }
}
struct MoneyText: View {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @EnvironmentObject private var store: AppStore
  let amount, currency: String
  var body: some View {
    Text(Money.format(amount, currency, hidden: store.hideAmounts)).monospacedDigit()
      .contentTransition(.numericText()).animation(
        reduceMotion ? nil : .easeInOut(duration: 0.4), value: amount
      ).privacySensitive()
  }
}
struct ProgressTrack: View {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  let value: Double
  var color: Color = Well.accent
  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(color.opacity(0.1))
        Capsule().fill(color).frame(width: max(0, geo.size.width * value))
      }
    }.frame(height: 6).animation(reduceMotion ? nil : .easeInOut(duration: 0.55), value: value)
      .accessibilityLabel("Progress").accessibilityValue("\(Int(value * 100)) percent")
  }
}
struct Arrive: ViewModifier {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var appeared = false
  var delay: Double = 0
  func body(content: Content) -> some View {
    content.opacity(appeared ? 1 : 0).offset(y: appeared || reduceMotion ? 0 : 14)
      .onAppear {
        withAnimation(
          reduceMotion ? nil : .spring(response: 0.65, dampingFraction: 0.88).delay(delay)
        ) { appeared = true }
      }
  }
}
extension View { func arrive(_ delay: Double = 0) -> some View { modifier(Arrive(delay: delay)) } }
