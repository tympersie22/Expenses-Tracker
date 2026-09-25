import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
function keys(path) {
  const values = [...readFileSync(path, "utf8").matchAll(/^"((?:[^"\\]|\\.)+)"\s*=/gm)].map((match) => match[1]);
  if (new Set(values).size !== values.length) throw new Error(`Duplicate localization key in ${path}`);
  return new Set(values);
}
function swiftFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? swiftFiles(join(path, item.name)) : item.name.endsWith(".swift") ? [join(path, item.name)] : []);
}
const root = "ios/ExpensesTracker";
const english = keys(`${root}/en.lproj/Localizable.strings`);
const swahili = keys(`${root}/sw.lproj/Localizable.strings`);
const missing = [...english].filter((key) => !swahili.has(key));
const extra = [...swahili].filter((key) => !english.has(key));
const uncovered = [];
for (const path of swiftFiles(root)) {
  const text = readFileSync(path, "utf8");
  for (const match of text.matchAll(/(?:Text|Button|Label|TextField|SecureField|Toggle|Picker|Section|navigationTitle|accessibilityLabel)\(\s*"((?:[^"\\]|\\.)*)"/g)) {
    if (match[1] && !match[1].includes("\\(") && !english.has(match[1])) uncovered.push({ path, key: match[1] });
  }
}
if (missing.length || extra.length || uncovered.length) {
  console.error(JSON.stringify({ missingInSwahili: missing, missingInEnglish: extra, uncoveredStaticUI: uncovered }, null, 2));
  process.exit(1);
}
console.log(`Catalog parity and static SwiftUI literal coverage pass: ${english.size} keys. Dynamic/server text still requires journey review.`);
