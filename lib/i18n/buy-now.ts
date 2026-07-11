/**
 * Browser-locale labels for the primary purchase CTA.
 * Falls back to English when the language is unknown.
 */
const BUY_NOW_LABELS: Record<string, string> = {
  en: "Buy now",
  es: "Comprar ahora",
  pt: "Comprar agora",
  fr: "Acheter maintenant",
  de: "Jetzt kaufen",
  it: "Acquista ora",
  nl: "Nu kopen",
  pl: "Kup teraz",
  ru: "Купить сейчас",
  uk: "Купити зараз",
  tr: "Şimdi satın al",
  ar: "اشترِ الآن",
  he: "קנה עכשיו",
  hi: "अभी खरीदें",
  zh: "立即购买",
  ja: "今すぐ購入",
  ko: "지금 구매",
  vi: "Mua ngay",
  th: "ซื้อเลย",
  id: "Beli sekarang",
  ms: "Beli sekarang",
  sv: "Köp nu",
  da: "Køb nu",
  no: "Kjøp nå",
  fi: "Osta nyt",
  cs: "Koupit nyní",
  ro: "Cumpără acum",
  hu: "Vásárlás most",
  el: "Αγορά τώρα",
  ca: "Compra ara",
};

const STARTING_CHECKOUT_LABELS: Record<string, string> = {
  en: "Starting checkout...",
  es: "Iniciando pago...",
  pt: "Iniciando pagamento...",
  fr: "Ouverture du paiement...",
  de: "Zur Kasse...",
  it: "Avvio pagamento...",
  nl: "Afrekenen starten...",
  pl: "Uruchamianie płatności...",
  ru: "Переход к оплате...",
  uk: "Перехід до оплати...",
  tr: "Ödeme başlatılıyor...",
  ar: "جاري بدء الدفع...",
  he: "מתחילים תשלום...",
  hi: "चेकआउट शुरू हो रहा है...",
  zh: "正在结账...",
  ja: "チェックアウトを開始...",
  ko: "결제 시작 중...",
  vi: "Đang thanh toán...",
  th: "กำลังชำระเงิน...",
  id: "Memulai pembayaran...",
  ms: "Memulakan pembayaran...",
  sv: "Startar kassa...",
  da: "Starter betaling...",
  no: "Starter betaling...",
  fi: "Aloitetaan kassa...",
  cs: "Spouštění pokladny...",
  ro: "Se pornește plata...",
  hu: "Pénztár indítása...",
  el: "Έναρξη πληρωμής...",
  ca: "Iniciant el pagament...",
};

function languageBase(locale: string | null | undefined): string {
  if (!locale) {
    return "en";
  }
  return locale.toLowerCase().split("-")[0] || "en";
}

export function resolveBrowserLocale(
  locale?: string | null,
): string {
  if (locale) {
    return languageBase(locale);
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return languageBase(navigator.language);
  }
  return "en";
}

export function buyNowLabel(locale?: string | null): string {
  const base = resolveBrowserLocale(locale);
  return BUY_NOW_LABELS[base] ?? BUY_NOW_LABELS.en;
}

export function startingCheckoutLabel(locale?: string | null): string {
  const base = resolveBrowserLocale(locale);
  return STARTING_CHECKOUT_LABELS[base] ?? STARTING_CHECKOUT_LABELS.en;
}
