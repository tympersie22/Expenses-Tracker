export type Language = "en" | "sw";

const sw: Record<string, string> = {
  "Home": "Nyumbani", "Activity": "Shughuli", "Plan": "Mipango", "Accounts": "Akaunti",
  "Settings": "Mipangilio", "Your preferences": "Mapendeleo yako", "Name": "Jina",
  "Preferred currency": "Sarafu unayopendelea", "Language": "Lugha", "Time zone": "Saa za eneo",
  "Save preferences": "Hifadhi mapendeleo", "Preferences saved.": "Mapendeleo yamehifadhiwa.",
  "Account security": "Usalama wa akaunti", "Current password": "Nenosiri la sasa",
  "New password": "Nenosiri jipya", "Change password": "Badilisha nenosiri",
  "At least 12 characters.": "Angalau herufi 12.",
  "Changing your password signs out your other sessions.": "Kubadilisha nenosiri kutatoa vifaa vingine kwenye akaunti.",
  "Used for your current day and monthly budgets.": "Hutumika kwa siku yako ya sasa na bajeti za mwezi.",
  "English is the default. Your choice follows your account.": "Kiingereza ni chaguo-msingi. Lugha unayochagua huhifadhiwa kwenye akaunti yako.",
  "A clearer picture.": "Picha iliyo wazi zaidi.", "Your activity.": "Shughuli zako.",
  "A plan with breathing room.": "Mpango wenye nafasi ya kutosha.",
  "All your money.": "Fedha zako zote.", "Make yourself at home.": "Jisikie nyumbani.",
  "Your money today. Your plans within reach.": "Fedha zako leo. Mipango yako ndani ya uwezo wako.",
  "Every account. One place to make sense of it.": "Kila akaunti. Sehemu moja ya kuelewa hali yako.",
  "Make room for what matters, one decision at a time.": "Tenga nafasi kwa yaliyo muhimu, uamuzi mmoja baada ya mwingine.",
  "Different places. One honest picture.": "Maeneo tofauti. Picha moja ya kweli.",
  "Your preferences, your privacy, your account.": "Mapendeleo yako, faragha yako, akaunti yako.",
  "Add account": "Ongeza akaunti", "Add transaction": "Ongeza muamala", "Import CSV": "Ingiza CSV",
  "Export": "Hamisha", "Sign out": "Ondoka", "Hide amounts": "Ficha kiasi",
  "Show amounts": "Onyesha kiasi", "View currency": "Angalia sarafu",
  "Available to spend": "Kinachopatikana kutumia", "Liquid balance": "Salio linalopatikana",
  "Upcoming bills": "Bili zijazo", "Set aside": "Kilichotengwa",
  "Food & groceries": "Chakula na mahitaji", "Transport": "Usafiri", "Housing": "Makazi",
  "Utilities": "Huduma", "Shopping": "Manunuzi", "Health": "Afya",
  "Entertainment": "Burudani", "Education": "Elimu", "Travel": "Safari",
  "Income": "Mapato", "Other": "Nyingine", "Transfer": "Uhamisho",
  "Remove": "Ondoa", "Mark paid": "Weka imelipwa", "Update goal": "Sasisha lengo",
  "Correct": "Sahihisha",
  "Today": "Leo", "Budget": "Bajeti", "Goals": "Malengo", "Bills": "Bili",
  "Connections & imports": "Miunganisho na uingizaji",
  "Banks & cards": "Benki na kadi",
  "Tanzania mobile money": "Pesa za simu Tanzania",
  "Bank and card feeds require an approved provider and your consent. Tanzania mobile-money business payment APIs do not provide personal wallet history.": "Miamala ya benki na kadi inahitaji mtoa huduma aliyeidhinishwa na ridhaa yako. API za malipo ya biashara za pesa za simu Tanzania hazitoi historia ya pochi binafsi.",
  "Live connection unavailable. You can add an account and import its statement CSV from Activity.": "Muunganisho wa moja kwa moja haupatikani. Unaweza kuongeza akaunti na kuingiza taarifa yake ya CSV kutoka Shughuli.",
  "Live wallet history unavailable. Record transactions manually or import a statement CSV.": "Historia ya pochi ya moja kwa moja haipatikani. Rekodi miamala mwenyewe au ingiza taarifa ya CSV.",
};

export function translate(language: string, phrase: string): string {
  return language === "sw" ? (sw[phrase] ?? phrase) : phrase;
}
