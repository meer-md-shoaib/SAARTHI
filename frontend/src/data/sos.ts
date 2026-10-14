import type { Translated } from "../types";

export type SosChoiceId = "pin_otp" | "rushing" | "unsure";

export interface SosChoice {
  id: SosChoiceId;
  art: "pin" | "threat" | "question";
  sub: Translated;
  steps: Translated[];
  spoken: Translated;
}

/**
 * Safety SOS: immediate, plain-language guidance.
 * Guidance only - this feature cannot block transactions or contact anyone.
 */
export const SOS_CHOICES: SosChoice[] = [
  {
    id: "pin_otp",
    art: "pin",
    sub: {
      en: "Credentials are being requested from you.",
      hi: "आपसे गोपनीय जानकारी माँगी जा रही है।",
      kn: "ನಿಮ್ಮಿಂದ ರಹಸ್ಯ ಮಾಹಿತಿ ಕೇಳಲಾಗುತ್ತಿದೆ.",
    },
    steps: [
      {
        en: "Stop right now. Do not share your UPI PIN, OTP, password or card details with anyone.",
        hi: "अभी रुकें। अपना UPI पिन, OTP, पासवर्ड या कार्ड की जानकारी किसी को न बताएँ।",
        kn: "ಈಗಲೇ ನಿಲ್ಲಿ. ನಿಮ್ಮ UPI ಪಿನ್, ಒಟಿಪಿ, ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಕಾರ್ಡ್ ಮಾಹಿತಿಯನ್ನು ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.",
      },
      {
        en: "Hang up or stop replying. A real bank will never ask for these, even on a video call.",
        hi: "फ़ोन रखें या जवाब देना बंद करें। असली बैंक कभी नहीं माँगता, वीडियो कॉल पर भी नहीं।",
        kn: "ಫೋನ್ ಇಡಿ ಅಥವಾ ಉತ್ತರಿಸುವುದು ನಿಲ್ಲಿಸಿ. ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ, ವೀಡಿಯೊ ಕರೆಯಲ್ಲೂ ಅಲ್ಲ.",
      },
      {
        en: "Already shared it? Open your bank app and change your UPI PIN and passwords immediately.",
        hi: "पहले ही बता दिया? बैंक ऐप खोलकर अभी अपना UPI पिन और पासवर्ड बदल दें।",
        kn: "ಈಗಾಗಲೇ ಹೇಳಿದ್ದೀರಾ? ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ತೆರೆದು ಈಗಲೇ UPI ಪಿನ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ.",
      },
      {
        en: "Call your bank on its official number and report suspicious calls on cyber crime helpline 1930.",
        hi: "बैंक के आधिकारिक नंबर पर कॉल करें और साइबर अपराध हेल्पलाइन 1930 पर शिकायत करें।",
        kn: "ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ ಮತ್ತು ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಗೆ ದೂರು ನೀಡಿ.",
      },
    ],
    spoken: {
      en: "Stop. Never share your UPI PIN, OTP or password with anyone. Real banks never ask for them. If you already shared them, change them in your bank app and call your bank now.",
      hi: "रुकें। अपना UPI पिन, OTP या पासवर्ड कभी किसी को न बताएँ। असली बैंक कभी नहीं माँगता। अगर बता दिया है, तो बैंक ऐप में बदलें और अभी बैंक को कॉल करें।",
      kn: "ನಿಲ್ಲಿ. ನಿಮ್ಮ UPI ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಯಾರಿಗೂ ಎಂದಿಗೂ ಹೇಳಬೇಡಿ. ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ. ಈಗಾಗಲೇ ಹೇಳಿದ್ದರೆ, ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ಬದಲಾಯಿಸಿ ಮತ್ತು ಈಗಲೇ ಬ್ಯಾಂಕಿಗೆ ಕರೆ ಮಾಡಿ.",
    },
  },
  {
    id: "rushing",
    art: "threat",
    sub: {
      en: "You are being pressured to act immediately.",
      hi: "आप पर तुरंत काम करने का दबाव डाला जा रहा है।",
      kn: "ನಿಮ್ಮ ಮೇಲೆ ತಕ್ಷಣ ಕೆಲಸ ಮಾಡಲು ಒತ್ತಡ ಹಾಕಲಾಗುತ್ತಿದೆ.",
    },
    steps: [
      {
        en: "Stop. You do not have to act right now. Real banks and police never threaten you for money.",
        hi: "रुकें। अभी काम करना ज़रूरी नहीं है। असली बैंक और पुलिस पैसों के लिए कभी धमकी नहीं देते।",
        kn: "ನಿಲ್ಲಿ. ಈಗ ಕೆಲಸ ಮಾಡಬೇಕಿಲ್ಲ. ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಮತ್ತು ಪೊಲೀಸ್ ಹಣಕ್ಕಾಗಿ ಎಂದಿಗೂ ಬೆದರಿಕೆ ನೀಡುವುದಿಲ್ಲ.",
      },
      {
        en: "Do not pay, scan any QR, or install an app because of fear.",
        hi: "डर के कारण भुगतान न करें, क्यूआर स्कैन न करें और कोई ऐप इंस्टॉल न करें।",
        kn: "ಭಯದಿಂದ ಪಾವತಿ ಮಾಡಬೇಡಿ, QR ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ ಅಥವಾ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಬೇಡಿ.",
      },
      {
        en: "Hang up, and call your bank on the number printed on your card or statement \u2014 not the number they gave you.",
        hi: "फ़ोन रखें और अपने कार्ड या स्टेटमेंट पर छपे नंबर से बैंक को कॉल करें \u2014 उनके दिए नंबर से नहीं।",
        kn: "ಫೋನ್ ಇಡಿ ಮತ್ತು ನಿಮ್ಮ ಕಾರ್ಡ್ ಅಥವಾ ಸ್ಟೇಟ್‌ಮೆಂಟ್‌ನಲ್ಲಿ ಮುದ್ರಿತ ನಂಬರ್‌ನಿಂದ ಬ್ಯಾಂಕಿಗೆ ಕರೆ ಮಾಡಿ \u2014 ಅವರು ನೀಡಿದ ನಂಬರ್‌ನಿಂದ ಅಲ್ಲ.",
      },
      {
        en: "Talk it over with family before any payment, and report the threat on 1930.",
        hi: "भुगतान से पहले परिवार से बात करें और धमकी की शिकायत 1930 पर करें।",
        kn: "ಯಾವುದೇ ಪಾವತಿಗೂ ಮೊದಲು ಕುಟುಂಬದೊಂದಿಗೆ ಮಾತನಾಡಿ ಮತ್ತು ಬೆದರಿಕೆಗೆ 1930 ರಲ್ಲಿ ದೂರು ನೀಡಿ.",
      },
    ],
    spoken: {
      en: "Stay calm. You do not have to pay because someone is rushing you. Hang up, check with your family, and call your bank on the official number if needed.",
      hi: "शांत रहें। कोई जल्दबाज़ी कराए तो भुगतान ज़रूरी नहीं है। फ़ोन रखें, परिवार से बात करें और ज़रूरत हो तो बैंक के आधिकारिक नंबर पर कॉल करें।",
      kn: "ಶಾಂತವಾಗಿರಿ. ಯಾರಾದರೂ ಅವಸರ ಹಾಕಿದರೆ ಪಾವತಿ ಮಾಡಬೇಕಿಲ್ಲ. ಫೋನ್ ಇಡಿ, ಕುಟುಂಬದೊಂದಿಗೆ ಮಾತನಾಡಿ ಮತ್ತು ಬೇಕಿದ್ದರೆ ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ.",
    },
  },
  {
    id: "unsure",
    art: "question",
    sub: {
      en: "Something about a QR code or payment feels wrong.",
      hi: "किसी क्यूआर या भुगतान के बारे में कुछ ठीक नहीं लग रहा।",
      kn: "QR ಅಥವಾ ಪಾವತಿಯ ಬಗ್ಗೆ ಏನೋ ಸರಿ ಕಾಣುತ್ತಿಲ್ಲ.",
    },
    steps: [
      {
        en: "Stop before entering your PIN. Nothing expires in the next few minutes.",
        hi: "पिन डालने से पहले रुकें। अगले कुछ मिनट में कुछ खत्म नहीं होने वाला।",
        kn: "ಪಿನ್ ನಮೂದಿಸುವ ಮೊದಲು ನಿಲ್ಲಿ. ಮುಂದಿನ ಕೆಲ ನಿಮಿಷಗಳಲ್ಲಿ ಏನೂ ಮುಗಿಯುವುದಿಲ್ಲ.",
      },
      {
        en: "Check the payee name and the exact amount shown on the payment screen.",
        hi: "भुगतान स्क्रीन पर दिख रहा नाम और सही राशि जाँचें।",
        kn: "ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ಕಾಣುವ ಹೆಸರು ಮತ್ತು ನಿಖರ ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ.",
      },
      {
        en: "Use \"Scan a QR Code\" in this app to check the code before you pay.",
        hi: "भुगतान से पहले इस ऐप में \"क्यूआर स्कैन करें\" से कोड जाँचें।",
        kn: "ಪಾವತಿಗೂ ಮೊದಲು ಈ ಆ್ಯಪ್‌ನ \"QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ\"ಯಿಂದ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ.",
      },
      {
        en: "Still unsure? Do not pay. Ask someone you trust, or contact your bank through its official channel.",
        hi: "फिर भी शक हो? भुगतान न करें। किसी भरोसेमंद से पूछें या बैंक के आधिकारिक रास्ते से संपर्क करें।",
        kn: "ಇನ್ನೂ ಅನುಮಾನವಿದ್ದರೆ? ಪಾವತಿ ಮಾಡಬೇಡಿ. ನಂಬಿಕೆಯವರನ್ನು ಕೇಳಿ ಅಥವಾ ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ಮಾರ್ಗದ ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ.",
      },
    ],
    spoken: {
      en: "Take your time. Check the name and amount, scan the code with this app, and if you are still unsure, do not pay and ask someone you trust.",
      hi: "आराम से करें। नाम और राशि जाँचें, इस ऐप से कोड स्कैन करें, और अगर फिर भी शक हो तो भुगतान न करें और किसी भरोसेमंद से पूछें।",
      kn: "ನಿಧಾನವಾಗಿ ಮಾಡಿ. ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ, ಈ ಆ್ಯಪ್‌ನಿಂದ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಇನ್ನೂ ಅನುಮಾನವಿದ್ದರೆ ಪಾವತಿ ಮಾಡಬೇಡಿ ಮತ್ತು ನಂಬಿಕೆಯವರನ್ನು ಕೇಳಿ.",
    },
  },
];
