"""Ask Saarthi - a small, deterministic, offline knowledge base.

No LLM is involved: answers are written by hand in English, Hindi and Kannada
and matched with simple keyword scoring. This keeps answers trustworthy,
identical every time, and usable without any AI API key.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any

FALLBACK_ID = "fallback"

_SPACE_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    """Lowercase and drop punctuation/symbols, keeping letters, marks, digits.

    Combining marks (matras) must survive or Indic scripts stop matching.
    """
    lowered = text.lower().replace("_", " ")
    kept = [ch for ch in lowered if unicodedata.category(ch)[0] not in ("P", "S")]
    return _SPACE_RE.sub(" ", "".join(kept)).strip()

TOPICS: list[dict[str, Any]] = [
    {
        "id": "upi_pin",
        "title": {
            "en": "What is a UPI PIN?",
            "hi": "UPI पिन क्या है?",
            "kn": "UPI ಪಿನ್ ಎಂದರೇನು?",
        },
        "keywords": {
            "en": ["upi pin", "pin", "password", "secret", "mpin"],
            "hi": ["पिन", "यूपीआई पिन", "पासवर्ड"],
            "kn": ["ಪಿನ್", "ಯುಪಿಐ", "ಪಾಸ್‌ವರ್ಡ್"],
        },
        "answer": {
            "en": (
                "Your UPI PIN is like the password for your money. You type it only "
                "inside your own payment app when you send money. Your bank, the "
                "shop, or any 'agent' will never ask for it. If someone asks for "
                "your UPI PIN, it is a trick - say no and stop."
            ),
            "hi": (
                "आपका UPI पिन आपके पैसों का पासवर्ड जैसा है। आप इसे सिर्फ अपने "
                "भुगतान ऐप में तब डालते हैं जब आप पैसे भेजते हैं। आपका बैंक, दुकान "
                "या कोई 'एजेंट' इसे कभी नहीं माँगेगा। अगर कोई आपसे UPI पिन माँगे तो "
                "यह धोखा है - मना करें और रुक जाएँ।"
            ),
            "kn": (
                "ನಿಮ್ಮ UPI ಪಿನ್ ನಿಮ್ಮ ಹಣದ ಪಾಸ್‌ವರ್ಡ್ ಇದ್ದಂತೆ. ನೀವು ಹಣ ಕಳುಹಿಸುವಾಗ "
                "ನಿಮ್ಮದೇ ಪಾವತಿ ಆ್ಯಪ್‌ನಲ್ಲಿ ಮಾತ್ರ ಅದನ್ನು ನಮೂದಿಸುತ್ತೀರಿ. ನಿಮ್ಮ "
                "ಬ್ಯಾಂಕ್, ಅಂಗಡಿ ಅಥವಾ ಯಾವುದೇ 'ಏಜೆಂಟ್' ಅದನ್ನು ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ. "
                "ಯಾರಾದರೂ ನಿಮ್ಮ UPI ಪಿನ್ ಕೇಳಿದರೆ ಅದು ವಂಚನೆ - ನಿರಾಕರಿಸಿ ನಿಲ್ಲಿ."
            ),
        },
    },
    {
        "id": "otp",
        "title": {
            "en": "Should I share my OTP?",
            "hi": "क्या मुझे OTP साझा करना चाहिए?",
            "kn": "ನನ್ನ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಕಾ?",
        },
        "keywords": {
            "en": ["otp", "one time password", "verification code", "authentication"],
            "hi": ["ओटीपी", "वन टाइम पासवर्ड", "सत्यापन कोड"],
            "kn": ["ಒಟಿಪಿ", "ಒ.ಟಿ.ಪಿ", "ಸತ್ಯಾಪನ ಕೋಡ್"],
        },
        "answer": {
            "en": (
                "Never share it. An OTP is a one-time password sent to your phone "
                "to approve a payment or login. Share it with no one - not even "
                "someone who says they are from your bank. Anyone who asks for your "
                "OTP is trying to take money from your account."
            ),
            "hi": (
                "कभी साझा न करें। OTP आपके फ़ोन पर भुगतान या लॉगिन की पुष्टि के लिए "
                "आने वाला एक बार का पासवर्ड है। इसे किसी के साथ साझा न करें - चाहे "
                "वह बैंक का कर्मचारी ही क्यों न कहे। जो भी आपसे OTP माँगता है, वह "
                "आपके खाते से पैसे निकालना चाहता है।"
            ),
            "kn": (
                "ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಒಟಿಪಿ ಪಾವತಿ ಅಥವಾ ಲಾಗಿನ್ ದೃಢೀಕರಿಸಲು ನಿಮ್ಮ "
                "ಫೋನ್‌ಗೆ ಬರುವ ಒಂದು ಬಾರಿಯ ಪಾಸ್‌ವರ್ಡ್. ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ - "
                "ನಿಮ್ಮ ಬ್ಯಾಂಕಿನವರು ಎಂದು ಹೇಳುವವರೊಂದಿಗೂ ಅಲ್ಲ. ಒಟಿಪಿ ಕೇಳುವ ಯಾರೂ "
                "ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ತೆಗೆಯಲು ಬಯಸುತ್ತಿದ್ದಾರೆ."
            ),
        },
    },
    {
        "id": "qr_check",
        "title": {
            "en": "How do I check a QR code?",
            "hi": "क्यूआर कैसे जाँचें?",
            "kn": "QR ಕೋಡ್ ಹೇಗೆ ಪರಿಶೀಲಿಸಬೇಕು?",
        },
        "keywords": {
            "en": ["qr", "qrcode", "qr code", "scan", "scanning", "safe to pay"],
            "hi": ["क्यूआर", "स्कैन", "क्यू आर"],
            "kn": ["ಕ್ಯೂಆರ್", "ಸ್ಕ್ಯಾನ್", "ಕ್ಯೂ ಆರ್"],
        },
        "answer": {
            "en": (
                "Scanning a QR code always starts a PAYMENT from your account - it "
                "never adds money to your account. Before you enter your PIN, check "
                "the payee name and the exact amount on the confirmation screen. If "
                "the name looks strange or the amount is wrong, cancel. When in "
                "doubt, use 'Scan a QR Code' in this app."
            ),
            "hi": (
                "क्यूआर स्कैन करने का मतलब हमेशा आपके खाते से भुगतान शुरू करना है - यह "
                "आपके खाते में कभी पैसे नहीं जोड़ता। पिन डालने से पहले पुष्टि स्क्रीन "
                "पर पाने वाले का नाम और सही राशि जाँचें। अगर नाम अजीब लगे या राशि "
                "गलत हो तो रद्द कर दें। शक हो तो इस ऐप में 'Scan a QR Code' खोलें।"
            ),
            "kn": (
                "QR ಸ್ಕ್ಯಾನ್ ಮಾಡುವುದು ಎಂದಿಗೂ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಪಾವತಿ ಪ್ರಾರಂಭಿಸುವುದು - "
                "ಇದು ನಿಮ್ಮ ಖಾತೆಗೆ ಎಂದಿಗೂ ಹಣ ಸೇರಿಸುವುದಿಲ್ಲ. ಪಿನ್ ನಮೂದಿಸುವ ಮೊದಲು "
                "ದೃಢೀಕರಣ ಪರದೆಯಲ್ಲಿ ಪಡೆಯುವವರ ಹೆಸರು ಮತ್ತು ನಿಖರ ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ. "
                "ಹೆಸರು ವಿಚಿತ್ರವಾಗಿದ್ದರೆ ಅಥವಾ ಮೊತ್ತ ತಪ್ಪಿದ್ದರೆ ರದ್ದುಗೊಳಿಸಿ. ಅನುಮಾನ "
                "ಬಂದರೆ ಈ ಆ್ಯಪ್‌ನ 'Scan a QR Code' ತೆರೆಯಿರಿ."
            ),
        },
    },
    {
        "id": "receive_money",
        "title": {
            "en": "Can I scan a QR to receive money?",
            "hi": "क्या पैसे पाने के लिए क्यूआर स्कैन करें?",
            "kn": "ಹಣ ಪಡೆಯಲು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದಾ?",
        },
        "keywords": {
            "en": ["receive money", "get money", "money will come", "claim", "prize", "cashback"],
            "hi": ["पैसे प्राप्त", "पैसे मिलेंगे", "पैसे आएंगे", "इनाम", "कैशबैक"],
            "kn": ["ಹಣ ಪಡೆ", "ಹಣ ಬರು", "ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್", "ಬಹುಮಾನ"],
        },
        "answer": {
            "en": (
                "No. To receive money you show YOUR QR code and the other person "
                "scans it. If someone asks you to scan their QR 'to receive money' "
                "or 'to claim a prize', it will take money OUT of your account. "
                "Never scan a QR code to receive money."
            ),
            "hi": (
                "नहीं। पैसे पाने के लिए आप अपना क्यूआर दिखाते हैं और दूसरा व्यक्ति "
                "उसे स्कैन करता है। अगर कोई आपसे उसका क्यूआर 'पैसे पाने के लिए' या "
                "'इनाम पाने के लिए' स्कैन करने को कहे, तो उससे आपके खाते से पैसे "
                "निकलेंगे। पैसे पाने के लिए कभी क्यूआर स्कैन न करें।"
            ),
            "kn": (
                "ಇಲ್ಲ. ಹಣ ಪಡೆಯಲು ನೀವು ನಿಮ್ಮದೇ QR ತೋರಿಸುತ್ತೀರಿ ಮತ್ತು ಇನ್ನೊಬ್ಬರು "
                "ಸ್ಕ್ಯಾನ್ ಮಾಡುತ್ತಾರೆ. ಯಾರಾದರೂ 'ಹಣ ಪಡೆಯಲು' ಅಥವಾ 'ಬಹುಮಾನ ಪಡೆಯಲು' "
                "ತಮ್ಮ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಹೇಳಿದರೆ, ಅದು ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ತೆಗೆಯುತ್ತದೆ. "
                "ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ."
            ),
        },
    },
    {
        "id": "amount",
        "title": {
            "en": "Check the amount before paying",
            "hi": "भुगतान से पहले राशि जाँचें",
            "kn": "ಪಾವತಿಗೂ ಮೊದಲು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ",
        },
        "keywords": {
            "en": ["amount", "price", "how much", "wrong amount", "total"],
            "hi": ["राशि", "कितने", "कीमत", "दाम"],
            "kn": ["ಮೊತ್ತ", "ಬೆಲೆ", "ಎಷ್ಟು"],
        },
        "answer": {
            "en": (
                "Always compare the amount on the payment screen with what you "
                "agreed to pay. Scammers quietly change the amount at the last "
                "moment. If it does not match, press Cancel, and ask the shopkeeper "
                "again before paying."
            ),
            "hi": (
                "भुगतान स्क्रीन पर दिख रही राशि हमेशा उस राशि से मिलाएँ जो आपने देने "
                "की सहमति दी थी। ठग आखिरी पल में राशि बदल देते हैं। अगर मेल न खाए "
                "तो रद्द दबाएँ और भुगतान से पहले दुकानदार से दोबारा पूछें।"
            ),
            "kn": (
                "ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ಕಾಣುವ ಮೊತ್ತವನ್ನು ಯಾವಾಗಲೂ ನೀವು ಒಪ್ಪಿದ್ದ ಮೊತ್ತದೊಂದಿಗೆ "
                "ಹೋಲಿಸಿ. ವಂಚಕರು ಕೊನೆಯ ಕ್ಷಣದಲ್ಲಿ ಮೊತ್ತ ಬದಲಾಯಿಸುತ್ತಾರೆ. ಹೊಂದಿಕೆಯಾಗದಿದ್ದರೆ "
                "ರದ್ದುಗೊಳಿಸಿ ಮತ್ತು ಪಾವತಿಗೂ ಮೊದಲು ಅಂಗಡಿಮಾಲೀರರನ್ನು ಮತ್ತೆ ಕೇಳಿ."
            ),
        },
    },
    {
        "id": "urgent",
        "title": {
            "en": "They are rushing or threatening me",
            "hi": "मुझे जल्दबाज़ी या धमकी दी जा रही है",
            "kn": "ನನಗೆ ಅವಸರ ಅಥವಾ ಬೆದರಿಕೆ",
        },
        "keywords": {
            "en": ["urgent", "threat", "threaten", "blocked", "police", "last warning", "rushing", "hurry", "kyc"],
            "hi": ["तुरंत", "धमकी", "ब्लॉक", "पुलिस", "जल्दी", "केवाईसी", "अंतिम चेतावनी"],
            "kn": ["ತಕ್ಷಣ", "ಬೆದರಿಕೆ", "ನಿರ್ಬಂಧ", "ಪೊಲೀಸ್", "ಅವಸರ", "ಕೆವೈಸಿ"],
        },
        "answer": {
            "en": (
                "Real banks never threaten you by phone or SMS. Stop and do not act "
                "now. Hang up and call your bank on the number printed on your card "
                "or statement - not the number they gave you. If you are unsure, "
                "open 'Safety SOS' in this app."
            ),
            "hi": (
                "असली बैंक फ़ोन या SMS पर कभी धमकी नहीं देता। रुकें और अभी काम न "
                "करें। फ़ोन रखें और बैंक को अपने कार्ड या स्टेटमेंट पर छपे नंबर पर "
                "कॉल करें - उनके दिए नंबर पर नहीं। शक हो तो इस ऐप में 'Safety SOS' "
                "खोलें।"
            ),
            "kn": (
                "ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಎಂದಿಗೂ ಫೋನ್ ಅಥವಾ SMS‌ನಲ್ಲಿ ಬೆದರಿಕೆ ನೀಡುವುದಿಲ್ಲ. "
                "ನಿಲ್ಲಿ ಮತ್ತು ಈಗ ಕೆಲಸ ಮಾಡಬೇಡಿ. ಫೋನ್ ಇಡಿ ಮತ್ತು ನಿಮ್ಮ ಕಾರ್ಡ್ ಅಥವಾ "
                "ಸ್ಟೇಟ್‌ಮೆಂಟ್‌ನಲ್ಲಿ ಮುದ್ರಿತ ನಂಬರ್‌ನಲ್ಲಿ ಬ್ಯಾಂಕಿಗೆ ಕರೆ ಮಾಡಿ - ಅವರು "
                "ನೀಡಿದ ನಂಬರ್‌ನಲ್ಲಿ ಅಲ್ಲ. ಅನುಮಾನವಿದ್ದರೆ ಈ ಆ್ಯಪ್‌ನ 'Safety SOS' ತೆರೆಯಿರಿ."
            ),
        },
    },
    {
        "id": "already_paid",
        "title": {
            "en": "I already paid a scammer",
            "hi": "मैंने पहले ही ठग को भुगतान कर दिया",
            "kn": "ನಾನು ಈಗಾಗಲೇ ವಂಚಕರಿಗೆ ಪಾವತಿಸಿದೆ",
        },
        "keywords": {
            "en": ["already paid", "lost money", "money gone", "fraud happened", "stolen", "wrong payment"],
            "hi": ["पैसे चले गए", "धोखा हो गया", "पहले भुगतान", "पैसे निकल गए"],
            "kn": ["ಹಣ ಹೋಗಿದೆ", "ವಂಚನೆ ಆಯಿತ", "ಈಗಾಗಲೇ ಪಾವತಿ"],
        },
        "answer": {
            "en": (
                "Call your bank immediately on its official number and ask them to "
                "block the transaction. Then report it on the cyber crime helpline "
                "1930 or at cybercrime.gov.in. Stop talking to the person who "
                "cheated you, and change your UPI PIN and passwords."
            ),
            "hi": (
                "तुरंत बैंक के आधिकारिक नंबर पर कॉल करके लेन-देन रोकने को कहें। फिर "
                "साइबर अपराध हेल्पलाइन 1930 या cybercrime.gov.in पर शिकायत करें। जिसने "
                "धोखा दिया उससे बात करना बंद करें, और अपना UPI पिन व पासवर्ड बदल दें।"
            ),
            "kn": (
                "ತಕ್ಷಣ ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ ವಹಿವಾಟು ನಿಲ್ಲಿಸಲು ಕೇಳಿ. "
                "ನಂತರ ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ದೂರು "
                "ನೀಡಿ. ನಿಮ್ಮನ್ನು ವಂಚಿಸಿದವರೊಂದಿಗೆ ಮಾತನಾಡುವುದು ನಿಲ್ಲಿಸಿ ಮತ್ತು UPI "
                "ಪಿನ್ ಹಾಗೂ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ."
            ),
        },
    },
    {
        "id": "scam_signs",
        "title": {
            "en": "How do I know it is a scam?",
            "hi": "मुझे कैसे पता चले कि यह ठगी है?",
            "kn": "ಇದು ವಂಚನೆ ಎಂದು ಹೇಗೆ ಗೊತ್ತು?",
        },
        "keywords": {
            "en": ["scam", "fraud", "suspicious", "fake", "is this safe", "cheat", "genuine", "real or fake"],
            "hi": ["ठगी", "धोखा", "फर्जी", "संदिग्झ", "क्या यह सही है"],
            "kn": ["ವಂಚನೆ", "ಸಂಶಯ", "ನಕಲಿ", "ಸರಿಯಾ ಎಂದು"],
        },
        "answer": {
            "en": (
                "Be careful if a message asks for your PIN, OTP or password; creates "
                "fear or hurry; promises a prize or cashback; asks you to scan a QR "
                "to receive money; or shows a different name or amount. When "
                "something feels wrong, stop and check with someone you trust."
            ),
            "hi": (
                "सावधान रहें अगर कोई संदेश: आपका पिन, OTP या पासवर्ड माँगे; डर या "
                "जल्दबाज़ी बनाए; इनाम या कैशबैक का वादा करे; पैसे पाने के लिए क्यूआर "
                "स्कैन करने को कहे; या नाम-राशि अलग दिखाए। जब कुछ गलत लगे तो रुकें "
                "और किसी भरोसेमंद व्यक्ति से जाँचें।"
            ),
            "kn": (
                "ಎಚ್ಚರಿಕೆ: ಸಂದೇಶ ನಿಮ್ಮ ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳಿದರೆ; ಭಯ "
                "ಅಥವಾ ಅವಸರ ಸೃಷ್ಟಿಸಿದರೆ; ಬಹುಮಾನ ಅಥವಾ ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ವಾಗ್ದಾನ ಮಾಡಿದರೆ; "
                "ಹಣ ಪಡೆಯಲು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಹೇಳಿದರೆ; ಅಥವಾ ಹೆಸರು-ಮೊತ್ತ ಬೇರೆ "
                "ತೋರಿಸಿದರೆ. ಏನಾದರೂ ತಪ್ಪು ಅನಿಸಿದರೆ ನಿಲ್ಲಿ ಮತ್ತು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ "
                "ಪರಿಶೀಲಿಸಿ."
            ),
        },
    },
    {
        "id": "about_app",
        "title": {
            "en": "About SAARTHI SafePay",
            "hi": "SAARTHI SafePay के बारे में",
            "kn": "SAARTHI SafePay ಬಗ್ಗೆ",
        },
        "keywords": {
            "en": ["about this app", "what is this app", "saarthi", "safepay", "privacy", "does it access my bank"],
            "hi": ["ऐप क्या है", "सारथी", "क्या यह ऐप", "जानकारी लेता है"],
            "kn": ["ಈ ಆ್ಯಪ್ ಏನು", "ಸಾರಥಿ", "ಆ್ಯಪ್ ಬಗ್ಗೆ"],
        },
        "answer": {
            "en": (
                "SAARTHI SafePay is a guidance app for safer digital payments. It "
                "reads only the payment details you choose to check, explains the "
                "warning signs, and suggests clear next steps. It never asks for "
                "your UPI PIN or OTP, never makes a payment, and never sends your "
                "details to a bank or an AI service."
            ),
            "hi": (
                "SAARTHI SafePay सुरक्षित डिजिटल भुगतान के लिए एक मार्गदर्शन ऐप है। "
                "यह केवल वही भुगतान जानकारी पढ़ता है जो आप जाँचने के लिए देते हैं, "
                "चेतावनी के संकेत बताता है और स्पष्ट अगला कदम सुझाता है। यह आपसे UPI "
                "पिन या OTP कभी नहीं माँगता, भुगतान कभी नहीं करता, और आपकी जानकारी "
                "किसी बैंक या AI सेवा को कभी नहीं भेजता।"
            ),
            "kn": (
                "SAARTHI SafePay ಸುರಕ್ಷಿತ ಡಿಜಿಟಲ್ ಪಾವತಿಗಳಿಗಾಗಿ ಮಾರ್ಗದರ್ಶನ ಆ್ಯಪ್. "
                "ಇದು ನೀವು ಪರಿಶೀಲಿಸಲು ನೀಡುವ ಪಾವತಿ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಓದುತ್ತದೆ, "
                "ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ ಮತ್ತು ಮುಂದಿನ ಸ್ಪಷ್ಟ ಹೆಜ್ಜೆ "
                "ಸೂಚಿಸುತ್ತದೆ. ಇದು ನಿಮ್ಮ UPI ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ, "
                "ಪಾವತಿ ಎಂದಿಗೂ ಮಾಡುವುದಿಲ್ಲ ಮತ್ತು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಬ್ಯಾಂಕ್ ಅಥವಾ "
                "AI ಸೇವೆಗೆ ಎಂದಿಗೂ ಕಳುಹಿಸುವುದಿಲ್ಲ."
            ),
        },
    },
    {
        "id": "safe_habits",
        "title": {
            "en": "Five habits for safe payments",
            "hi": "सुरक्षित भुगतान की पाँच आदतें",
            "kn": "ಸುರಕ್ಷಿತ ಪಾವತಿಗೆ ಐದು ಅಭ್ಯಾಸಗಳು",
        },
        "keywords": {
            "en": ["tips", "habits", "how to stay safe", "advice", "prevent", "protect"],
            "hi": ["सुरक्षा टिप्स", "आदतें", "बचाव", "सलाह"],
            "kn": ["ಸಲಹೆ", "ಅಭ್ಯಾಸ", "ಹೇಗೆ ಸುರಕ್ಷಿತ", "ತಡೆ"],
        },
        "answer": {
            "en": (
                "1) Never share your UPI PIN, OTP or password. 2) Scan a QR only to "
                "pay, never to receive. 3) Check the payee name and amount every "
                "time. 4) Do not act on calls or messages that create fear or "
                "hurry. 5) When unsure, stop - use this app or ask someone you "
                "trust."
            ),
            "hi": (
                "1) अपना UPI पिन, OTP या पासवर्ड कभी न बताएं। 2) क्यूआर सिर्फ "
                "भुगतान के लिए ही स्कैन करें, पैसे पाने के लिए नहीं। 3) हर बार "
                "पाने वाले का नाम और राशि जाँचें। 4) डर या जल्दबाज़ी वाले कॉल-संदेश "
                "पर काम न करें। 5) शक हो तो रुकें - इस ऐप का उपयोग करें या किसी "
                "भरोसेमंद से पूछें।"
            ),
            "kn": (
                "1) ನಿಮ್ಮ UPI ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಎಂದಿಗೂ ಹೇಳಬೇಡಿ. "
                "2) QR ಅನ್ನು ಪಾವತಿಗೆ ಮಾತ್ರ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಹಣ ಪಡೆಯಲು ಅಲ್ಲ. "
                "3) ಪ್ರತಿ ಬಾರಿ ಪಡೆಯುವವರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ. 4) ಭಯ "
                "ಅಥವಾ ಅವಸರದ ಕರೆ-ಸಂದೇಶಕ್ಕೆ ಕ್ರಮ ಬೇಡ. 5) ಅನುಮಾನ ಬಂದರೆ ನಿಲ್ಲಿ - "
                "ಈ ಆ್ಯಪ್ ಬಳಸಿ ಅಥವಾ ನಂಬಿಕೆಯವರನ್ನು ಕೇಳಿ."
            ),
        },
    },
    {
        "id": FALLBACK_ID,
        "title": {
            "en": "Ask something else",
            "hi": "कुछ और पूछें",
            "kn": "ಬೇರೆ ಏನಾದರೂ ಕೇಳಿ",
        },
        "keywords": {"en": [], "hi": [], "kn": []},
        "answer": {
            "en": (
                "I can help with: UPI PIN and OTP safety, checking QR codes, "
                "receiving money, amounts, suspicious calls or messages, and what to "
                "do after a wrong payment. Please type your question, or tap one of "
                "the suggestions."
            ),
            "hi": (
                "मैं इनमें मदद कर सकता हूँ: UPI पिन व OTP सुरक्षा, क्यूआर जाँच, पैसे "
                "प्राप्त करना, राशि, संदिग्झ कॉल-संदेश, और गलत भुगतान के बाद क्या "
                "करें। कृपया अपना सवाल लिखें या सुझावों पर टैप करें।"
            ),
            "kn": (
                "ನಾನು ಇವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ: UPI ಪಿನ್ ಮತ್ತು ಒಟಿಪಿ ಸುರಕ್ಷತೆ, QR "
                "ಪರಿಶೀಲನೆ, ಹಣ ಪಡೆಯುವಿಕೆ, ಮೊತ್ತ, ಸಂಶಯಾಸ್ಪದ ಕರೆ-ಸಂದೇಶ, ಮತ್ತು "
                "ತಪ್ಪು ಪಾವತಿಯ ನಂತರ ಏನು ಮಾಡಬೇಕು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ "
                "ಅಥವಾ ಸೂಚನೆಗಳ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ."
            ),
        },
    },
]

TOPICS_BY_ID: dict[str, dict[str, Any]] = {topic["id"]: topic for topic in TOPICS}
ANSWERABLE_IDS: list[str] = [topic["id"] for topic in TOPICS if topic["id"] != FALLBACK_ID]


def _pick(text: str, table: dict[str, str], language: str) -> str:
    if language in table:
        return table[language]
    return table["en"]


def _topic_score(candidate: dict[str, Any], normalized: str) -> int:
    """Score a topic against the question; longer phrases weigh more."""
    score = 0
    for language_keywords in candidate["keywords"].values():
        for keyword in language_keywords:
            if not keyword:
                continue
            normalized_keyword = _normalize(keyword)
            if normalized_keyword and normalized_keyword in normalized:
                score += max(1, len(normalized_keyword.split()))
    return score


def answer_question(
    text: str, language: str = "en", topic_id: str | None = None
) -> dict[str, Any]:
    """Match a question to a curated topic or analyze messages using the ML pipeline.

    - If topic_id is provided, answers directly from curated knowledge.
    - If the user provides an SMS/message for evaluation or asks about a message containing
      fraud patterns, analyzes it dynamically using the ML message analysis service.
    - Retains curated FAQs as a reliable fallback for conceptual payment safety questions.
    """
    from .ml.service import get_message_analysis_service

    lang = language if language in ("en", "hi", "kn") else "en"
    clean_text = text.strip()
    normalized = _normalize(clean_text)

    # 1. Direct topic selection via chips
    if topic_id and topic_id in TOPICS_BY_ID and topic_id != FALLBACK_ID:
        topic = TOPICS_BY_ID[topic_id]
        suggested_ids = [
            cid for cid in ANSWERABLE_IDS if cid != topic["id"]
        ][:3]
        return {
            "topic_id": topic["id"],
            "question": clean_text,
            "title": _pick(topic["title"], topic["title"], lang),
            "answer": _pick(topic["answer"], topic["answer"], lang),
            "suggested": [
                {
                    "topic_id": cid,
                    "title": _pick(
                        TOPICS_BY_ID[cid]["title"],
                        TOPICS_BY_ID[cid]["title"],
                        lang,
                    ),
                }
                for cid in suggested_ids
            ],
            "language": lang,
            "answered_by": "knowledge_base",
        }

    # 2. Check if the input looks like a message to analyze (SMS, alert, link, or scam pattern)
    is_message_format = (
        len(clean_text) > 35
        and any(
            marker in clean_text.lower()
            for marker in (
                "http", "www.", ".top", ".site", ".xyz", ".apk", "kyc", "sbi", "hdfc",
                "paytm", "phonepe", "electricity", "bill", "disconnected", "lottery",
                "cashback", "dear customer", "dear user", "acc", "a/c", "credited", "debited"
            )
        )
    )

    if is_message_format:
        service = get_message_analysis_service()
        ml_res = service.analyze_message(text=clean_text, language=lang)
        if ml_res["category"] == "scam" or ml_res["subcategories"] or ml_res["risk_level"] == "high":
            # Formulate structured dynamic companion response
            title_map = {
                "en": f"Message Safety Analysis: High Risk ({ml_res['category'].title()})",
                "hi": f"संदेश सुरक्षा विश्लेषण: उच्च जोखिम ({ml_res['category']})",
                "kn": f"ಸಂದೇಶ ಸುರಕ್ಷತಾ ವಿಶ್ಲೇಷಣೆ: ಹೆಚ್ಚಿನ ಅಪಾಯ ({ml_res['category']})",
            }
            steps_joined = "\n• " + "\n• ".join(ml_res["safe_next_steps"]) if ml_res["safe_next_steps"] else ""
            answer_text = f"{ml_res['explanation']}\n\nRecommended Safe Next Steps:{steps_joined}"

            suggested_ids = ["scam_call", "otp", "fake_support"]
            return {
                "topic_id": "message_analysis",
                "question": clean_text,
                "title": title_map.get(lang, title_map["en"]),
                "answer": answer_text,
                "suggested": [
                    {
                        "topic_id": cid,
                        "title": _pick(
                            TOPICS_BY_ID[cid]["title"],
                            TOPICS_BY_ID[cid]["title"],
                            lang,
                        ),
                    }
                    for cid in suggested_ids
                    if cid in TOPICS_BY_ID
                ],
                "language": lang,
                "answered_by": "ml_message_analysis",
            }

    # 3. Match against curated knowledge base topics
    best_score = 0
    matched_topic: dict[str, Any] | None = None
    for candidate in TOPICS:
        if candidate["id"] == FALLBACK_ID:
            continue
        score = _topic_score(candidate, normalized)
        if score > best_score:
            best_score = score
            matched_topic = candidate

    if matched_topic is None:
        matched_topic = TOPICS_BY_ID[FALLBACK_ID]

    suggested_ids = [
        candidate_id
        for candidate_id in ANSWERABLE_IDS
        if candidate_id != matched_topic["id"]
    ][:3]

    return {
        "topic_id": matched_topic["id"],
        "question": clean_text,
        "title": _pick(matched_topic["title"], matched_topic["title"], lang),
        "answer": _pick(matched_topic["answer"], matched_topic["answer"], lang),
        "suggested": [
            {
                "topic_id": candidate_id,
                "title": _pick(
                    TOPICS_BY_ID[candidate_id]["title"],
                    TOPICS_BY_ID[candidate_id]["title"],
                    lang,
                ),
            }
            for candidate_id in suggested_ids
        ],
        "language": lang,
        "answered_by": "knowledge_base",
    }

