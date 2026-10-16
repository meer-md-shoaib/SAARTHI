/**
 * Language definitions and capabilities for SAARTHI SafePay.
 *
 * Full support: Sarvam Bulbul v3 & Saaras v4 support all 11 languages for voice.
 * UI translations now exist across all 11 languages!
 */

import type { Lang } from "../types";

export interface LanguageInfo {
  code: Lang;
  label: string;
  native: string;
  hasUiTranslation: boolean;
  speechSupported: boolean;
  bcp47: string;
  greeting: string;
  assistantPrompt: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    label: "English",
    native: "English",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "en-IN",
    greeting: "Namaste! I am SAARTHI, your payment safety companion. Tap the microphone or say 'Scan QR' to begin.",
    assistantPrompt: "I'm listening. How can I help you with your payment safety today?",
  },
  {
    code: "hi",
    label: "Hindi",
    native: "हिन्दी",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "hi-IN",
    greeting: "नमस्ते! मैं सारथी हूँ, आपका डिजिटल भुगतान सुरक्षा साथी। माइक पर टैप करें या 'QR स्कैन करो' कहें।",
    assistantPrompt: "मैं सुन रहा हूँ। भुगतान सुरक्षा में आपकी क्या मदद करूँ?",
  },
  {
    code: "kn",
    label: "Kannada",
    native: "ಕನ್ನಡ",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "kn-IN",
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ಸಾರಥಿ, ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಪಾವತಿ ಸುರಕ್ಷಾ ಸಹಾಯಕ. ಮೈಕ್ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ ಅಥವಾ 'QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' ಎಂದು ಹೇಳಿ.",
    assistantPrompt: "ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ಪಾವತಿ ಸುರಕ್ಷತೆಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
  },
  {
    code: "te",
    label: "Telugu",
    native: "తెలుగు",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "te-IN",
    greeting: "నమస్కారం! నేను సారథి, మీ డిజిటల్ చెల్లింపుల భద్రతా సహాయకుడిని. మైక్ నొక్కండి లేదా 'QR స్కాన్' చేయండి.",
    assistantPrompt: "నేను వింటున్నాను. చెల్లింపు భద్రతలో మీకు ఎలా సహాయపడగలను?",
  },
  {
    code: "ta",
    label: "Tamil",
    native: "தமிழ்",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "ta-IN",
    greeting: "வணக்கம்! நான் சாரதி, உங்கள் டிஜிட்டல் பரிவர்த்தனை பாதுகாப்பு துணைவன்.",
    assistantPrompt: "நான் கேட்கிறேன். பாதுகாப்பான பரிவர்த்தனைக்கு உங்களுக்கு எப்படி உதவ முடியும்?",
  },
  {
    code: "bn",
    label: "Bengali",
    native: "বাংলা",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "bn-IN",
    greeting: "নমস্কার! আমি সারথি, আপনার ডিজিটাল পেমেন্ট সুরক্ষা সহকারী।",
    assistantPrompt: "আমি শুনছি। নিরাপদ পেমেন্টের জন্য আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
  },
  {
    code: "mr",
    label: "Marathi",
    native: "मराठी",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "mr-IN",
    greeting: "नमस्कार! मी सारथी, आपला डिजिटल पेमेंट सुरक्षा सहाय्यक.",
    assistantPrompt: "मी ऐकत आहे. सुरक्षित पेमेंटसाठी मी तुम्हाला कशी मदत करू?",
  },
  {
    code: "gu",
    label: "Gujarati",
    native: "ગુજરાતી",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "gu-IN",
    greeting: "નમસ્તે! હું સારથી છું, આપનો ડિજિટલ ચુકવણી સુરક્ષા સાથી.",
    assistantPrompt: "હું સાંભળી રહ્યો છું. સુરક્ષિત ચુકવણી માટે હું તમારી શી મદદ કરી શકું?",
  },
  {
    code: "ml",
    label: "Malayalam",
    native: "മലയാളം",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "ml-IN",
    greeting: "നമസ്കാരം! ഞാൻ സಾರഥി, നിങ്ങളുടെ ഡിജിറ്റൽ പേയ്മെന്റ് സുരക്ഷാ സഹായി.",
    assistantPrompt: "ഞാൻ കേൾക്കുന്നുണ്ട്. സുരക്ഷിത പേയ്മെന്റുകൾക്കായി ഞാൻ എങ്ങനെ സഹായിക്കാം?",
  },
  {
    code: "pa",
    label: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "pa-IN",
    greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਸਾਰਥੀ ਹਾਂ, ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਭੁਗਤਾਨ ਸੁਰੱਖਿਆ ਸਾਥੀ।",
    assistantPrompt: "ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ ਵਿੱਚ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
  },
  {
    code: "od",
    label: "Odia",
    native: "ଓଡ଼ିଆ",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "or-IN",
    greeting: "ନମସ୍କାର! ମୁଁ ସାରଥୀ, ଆପଣଙ୍କ ଡିଜିଟାଲ୍ ପେମେଣ୍ଟ ସୁରକ୍ଷା ସାଥୀ।",
    assistantPrompt: "ମୁଁ ଶୁଣୁଛି। ସୁରକ୍ଷିତ ପେମେଣ୍ଟ ପାଇଁ ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ್ಯ କରିପାରିବି?",
  },
  {
    code: "ur",
    label: "Urdu",
    native: "اردو",
    hasUiTranslation: true,
    speechSupported: true,
    bcp47: "ur-IN",
    greeting: "السلام علیکم! میں سارتھی ہوں، آپ کا ڈیجیٹل ادائیگی حفاظتی ساتھی۔ مائیک پر ٹیپ کریں یا 'QR اسکین کرو' بولیں۔",
    assistantPrompt: "میں سن رہا ہوں۔ ادائیگی کی حفاظت میں میں آپ کی کیا مدد کر سکتا ہوں؟",
  },
];

export function getLanguageInfo(code: string): LanguageInfo {
  const clean = code.toLowerCase().trim();
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === clean);
  return found ?? SUPPORTED_LANGUAGES[0];
}
