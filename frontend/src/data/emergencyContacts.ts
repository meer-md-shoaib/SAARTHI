/**
 * Emergency Contacts and National Cyber Crime Portal information.
 *
 * Provides immediate one-touch family emergency contacts (Son, Wife, Grandson, Granddaughter)
 * and direct access to India's National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in).
 */

export type LanguageCode = "en" | "hi" | "kn";

export interface EmergencyContact {
  id: string;
  name: Record<LanguageCode, string>;
  relation: Record<LanguageCode, string>;
  phone: string;
  avatarRole: "son" | "wife" | "grandson" | "granddaughter";
  badgeBg: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "son",
    name: { en: "Rahul", hi: "राहुल", kn: "ರಾಹುಲ್" },
    relation: { en: "Son", hi: "बेटा", kn: "ಮಗ" },
    phone: "+919876543210",
    avatarRole: "son",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "wife",
    name: { en: "Savitri", hi: "सावित्री", kn: "ಸಾವಿತ್ರಿ" },
    relation: { en: "Wife", hi: "पत्नी", kn: "ಪತ್ನಿ" },
    phone: "+919876543211",
    avatarRole: "wife",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    id: "grandson",
    name: { en: "Aarav", hi: "आरव", kn: "ಆರವ್" },
    relation: { en: "Grandson", hi: "पोता", kn: "ಮೊಮ್ಮಗ" },
    phone: "+919876543212",
    avatarRole: "grandson",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "granddaughter",
    name: { en: "Ananya", hi: "अनन्या", kn: "ಅನನ್ಯ" },
    relation: { en: "Granddaughter", hi: "पोती", kn: "ಮೊಮ್ಮಗಳು" },
    phone: "+919876543213",
    avatarRole: "granddaughter",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
];

export const EMERGENCY_MESSAGES: Record<LanguageCode, string> = {
  en: "EMERGENCY SOS from SAARTHI: I am feeling suspicious about a payment or call right now. Someone is rushing me. Please call me immediately!",
  hi: "आपातकालीन अलर्ट (SAARTHI): मुझे किसी पेमेंट या कॉल पर बहुत शक हो रहा है। कोई मुझसे जल्दबाज़ी में पैसे मांग रहा है। कृपया मुझे तुरंत कॉल करें!",
  kn: "ತುರ್ತು ಎಚ್ಚರಿಕೆ (SAARTHI): ನನಗೆ ಒಂದು ಕರೆ ಅಥವಾ ಪಾವತಿಯ ಬಗ್ಗೆ ಗಂಭೀರ ಸಂಶಯವಿದೆ. ಯಾರೋ ಒತ್ತಾಯ ಮಾಡುತ್ತಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ನನಗೆ ಕರೆ ಮಾಡಿ!",
};

export const CYBER_CRIME_PORTAL = {
  url: "https://cybercrime.gov.in/home",
  helpline: "1930",
  title: {
    en: "National Cyber Crime Reporting Portal",
    hi: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल",
    kn: "ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಅಪರಾಧ ವರದಿ ಪೋರ್ಟಲ್",
  },
  subtitle: {
    en: "Ministry of Home Affairs, Government of India",
    hi: "गृह मंत्रालय, भारत सरकार",
    kn: "ಗೃಹ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ",
  },
  description: {
    en: "Report financial cyber fraud immediately. Dial 1930 or submit a complaint online within the 2-hour golden period to freeze stolen funds in the banking system.",
    hi: "वित्तीय धोखाधड़ी होने पर तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें ताकि बैंक में पैसे फ्रीज किए जा सकें।",
    kn: "ಯಾವುದೇ ಆನ್‌ಲೈನ್ ವಂಚನೆಯಾದರೆ ತಕ್ಷಣ 1930 ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ ಬ್ಯಾಂಕ್ ಖಾತೆಯಲ್ಲಿ ಹಣ ಸ್ಥಗಿತಗೊಳಿಸಿ.",
  },
  actionText: {
    en: "Visit cybercrime.gov.in",
    hi: "cybercrime.gov.in पोर्टल खोलें",
    kn: "cybercrime.gov.in ಭೇಟಿ ನೀಡಿ",
  },
  callText: {
    en: "Dial 1930 Helpline",
    hi: "हेल्पलाइन 1930 पर कॉल करें",
    kn: "1930 ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ",
  },
};
