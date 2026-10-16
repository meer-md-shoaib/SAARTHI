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
            "ur": "UPI پن کیا ہے؟",
        },
        "keywords": {
            "en": ["upi pin", "pin", "password", "secret", "mpin"],
            "hi": ["पिन", "यूपीआई पिन", "पासवर्ड"],
            "kn": ["ಪಿನ್", "ಯುಪಿಐ", "ಪಾಸ್‌ವರ್ಡ್"],
            "ur": ["یو پی آئی پن", "پن", "پاس ورڈ", "خفیہ", "ایم پن"],
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
            "ur": (
                "آپ کا UPI پن آپ کے پیسوں کے پاس ورڈ کی طرح ہے۔ یہ آپ صرف اپنی "
                "ادائیگی ایپ میں اس وقت درج کرتے ہیں جب آپ رقم بھیج رہے ہوتے ہیں۔ "
                "آپ کا بینک، دکان دار یا کوئی بھی 'ایجنٹ' کبھی یہ نہیں مانگے گا۔ "
                "اگر کوئی آپ سے UPI پن مانگے تو یہ دھوکہ ہے - فوراً انکار کریں اور رک جائیں۔"
            ),
        },
    },
    {
        "id": "otp",
        "title": {
            "en": "Should I share my OTP?",
            "hi": "क्या मुझे OTP साझा करना चाहिए?",
            "kn": "ನನ್ನ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಕಾ?",
            "ur": "کیا مجھے OTP شیئر کرنا چاہیے؟",
        },
        "keywords": {
            "en": ["otp", "one time password", "verification code", "authentication"],
            "hi": ["ओटीपी", "वन टाइम पासवर्ड", "सत्यापन कोड"],
            "kn": ["ಒಟಿಪಿ", "ಒ.ಟಿ.ಪಿ", "ಸತ್ಯಾಪನ ಕೋಡ್"],
            "ur": ["او ٹی پی", "اوٹی پی", "ون ٹائم پاس ورڈ", "تصدیقی کوڈ"],
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
            "ur": (
                "کبھی شیئر نہ کریں۔ او ٹی پی ایک بار کا پاس ورڈ ہے جو ادائیگی یا لاگ ان "
                "کی تصدیق کے لیے آپ کے فون پر آتا ہے۔ اسے کسی کے ساتھ شیئر نہ کریں - چاہے "
                "وہ خود کو بینک کا نمائندہ ہی کیوں نہ کہے۔ جو بھی آپ سے او ٹی پی مانگتا ہے وہ "
                "آپ کے اکاؤنٹ سے پیسے نکالنے کی کوشش کر رہا ہے۔"
            ),
        },
    },
    {
        "id": "qr_check",
        "title": {
            "en": "How do I check a QR code?",
            "hi": "क्यूआर कैसे जाँचें?",
            "kn": "QR ಕೋಡ್ ಹೇಗೆ ಪರಿಶೀಲಿಸಬೇಕು?",
            "ur": "کیو آر کوڈ کیسے چیک کریں؟",
        },
        "keywords": {
            "en": ["qr", "qrcode", "qr code", "scan", "scanning", "safe to pay"],
            "hi": ["क्यूआर", "स्कैन", "क्यू आर"],
            "kn": ["ಕ್ಯೂಆರ್", "ಸ್ಕ್ಯಾನ್", "ಕ್ಯೂ ಆರ್"],
            "ur": ["کیو آر", "اسکین", "کیو آر کوڈ"],
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
            "ur": (
                "کیو آر اسکین کرنے کا مطلب ہمیشہ آپ کے اکاؤنٹ سے رقم کی ادائیگی شروع کرنا ہے - "
                "یہ آپ کے اکاؤنٹ میں کبھی رقم شامل نہیں کرتا۔ پن درج کرنے سے پہلے تصدیقی اسکرین "
                "پر وصول کنندہ کا نام اور درست رقم ضرور دیکھیں۔ اگر نام عجیب لگے یا رقم غلط ہو "
                "تو فوراً منسوخ کر دیں۔ شک ہو تو اس ایپ میں 'کیو آر اسکین کریں' کھولیں۔"
            ),
        },
    },
    {
        "id": "receive_money",
        "title": {
            "en": "Can I scan a QR to receive money?",
            "hi": "क्या पैसे पाने के लिए क्यूआर स्कैन करें?",
            "kn": "ಹಣ ಪಡೆಯಲು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದಾ?",
            "ur": "کیا پیسے وصول کرنے کے لیے کیو آر اسکین کریں؟",
        },
        "keywords": {
            "en": ["receive money", "get money", "money will come", "claim", "prize", "cashback"],
            "hi": ["पैसे प्राप्त", "पैसे मिलेंगे", "पैसे आएंगे", "इनाम", "कैशबैक"],
            "kn": ["ಹಣ ಪಡೆ", "ಹಣ ಬರು", "ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್", "ಬಹುಮಾನ"],
            "ur": ["پیسے موصول", "پیسے آئیں گے", "کیش بیک", "انعام", "لاٹری"],
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
            "ur": (
                "ہرگز نہیں! کیو آر اسکین کرنے سے رقم کٹتی ہے، موصول نہیں ہوتی۔ اگر کوئی "
                "کہتا ہے کہ 'پیسے پانے کے لیے کیو آر اسکین کریں اور پن درج کریں'، تو یہ "
                "دھوکہ ہے۔ پن صرف رقم بھیجتے وقت درج کیا جاتا ہے، رقم وصول کرنے کے لیے پن کی کبھی ضرورت نہیں ہوتی۔"
            ),
        },
    },
    {
        "id": "amount",
        "title": {
            "en": "Check the amount before paying",
            "hi": "भुगतान से पहले राशि जाँचें",
            "kn": "ಪಾವತಿಗೂ ಮೊದಲು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ",
            "ur": "ادائیگی سے پہلے رقم ضرور چیک کریں",
        },
        "keywords": {
            "en": ["amount", "price", "how much", "wrong amount", "total"],
            "hi": ["राशि", "कितने", "कीमत", "दाम"],
            "kn": ["ಮೊತ್ತ", "ಬೆಲೆ", "ಎಷ್ಟು"],
            "ur": ["رقم", "کتنے پیسے", "قیمت", "دام"],
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
            "ur": (
                "ہمیشہ تصدیقی اسکرین پر رقم کو دھیان سے دیکھیں۔ کچھ فراڈیے کیو آر میں "
                "رقم خالی چھوڑ دیتے ہیں یا بڑی رقم لکھ دیتے ہیں۔ تصدیق کریں کہ رقم وہی "
                "ہے جو آپ ادا کرنا چاہتے ہیں۔"
            ),
        },
    },
    {
        "id": "urgent",
        "title": {
            "en": "They are rushing or threatening me",
            "hi": "मुझे जल्दबाज़ी या धमकी दी जा रही है",
            "kn": "ನನಗೆ ಅವಸರ ಅಥವಾ ಬೆದರಿಕೆ",
            "ur": "مجھ پر جلد بازی یا دھمکی کا دباؤ ہے",
        },
        "keywords": {
            "en": ["urgent", "threat", "threaten", "blocked", "police", "last warning", "rushing", "hurry", "kyc"],
            "hi": ["तुरंत", "धमकी", "ब्लॉक", "पुलिस", "जल्दी", "केवाईसी", "अंतिम चेतावनी"],
            "kn": ["ತಕ್ಷಣ", "ಬೆದರಿಕೆ", "ನಿರ್ಬಂಧ", "ಪೊಲೀಸ್", "ಅವಸರ", "ಕೆವೈಸಿ"],
            "ur": ["فوری", "دھمکی", "بلاک", "پولیس", "جلدی", "کے وائی سی", "آخری وارننگ"],
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
            "ur": (
                "اصلی بینک فون یا ایس ایم ایس پر کبھی دھمکی نہیں دیتا۔ رک جائیں اور ابھی کارروائی "
                "نہ کریں۔ فون کاٹ دیں اور بینک کے کارڈ یا پاس بک پر لکھے نمبر پر کال کریں۔ "
                "اگر شک ہو تو اس ایپ میں 'Safety SOS' کھولیں۔"
            ),
        },
    },
    {
        "id": "already_paid",
        "title": {
            "en": "I already paid a scammer",
            "hi": "मैंने पहले ही ठग को भुगतान कर दिया",
            "kn": "ನಾನು ಈಗಾಗಲೇ ವಂಚಕರಿಗೆ ಪಾವತಿಸಿದೆ",
            "ur": "میں پہلے ہی دھوکے باز کو ادائیگی کر چکا ہوں",
        },
        "keywords": {
            "en": ["already paid", "lost money", "money gone", "fraud happened", "stolen", "wrong payment"],
            "hi": ["पैसे चले गए", "धोखा हो गया", "पहले भुगतान", "पैसे निकल गए"],
            "kn": ["ಹಣ ಹೋಗಿದೆ", "ವಂಚನೆ ಆಯಿತ", "ಈಗಾಗಲೇ ಪಾವತಿ"],
            "ur": ["پیسے چلے گئے", "دھوکہ ہو گیا", "پہلے ادائیگی کر دی", "پیسے نکل گئے"],
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
            "ur": (
                "فوراً بینک کے آفیشل نمبر پر کال کر کے لین دین روکنے کی درخواست کریں۔ پھر "
                "سائبر کرائم ہیلپ لائن 1930 یا cybercrime.gov.in پر شکایت درج کریں۔ جس نے دھوکہ "
                "دیا اس سے بات کرنا بند کر دیں اور اپنا یو پی آئی پن اور پاس ورڈ فوراً تبدیل کریں۔"
            ),
        },
    },
    {
        "id": "scam_signs",
        "title": {
            "en": "How do I know it is a scam?",
            "hi": "मुझे कैसे पता चले कि यह ठगी है?",
            "kn": "ಇದು ವಂಚನೆ ಎಂದು ಹೇಗೆ ಗೊತ್ತು?",
            "ur": "مجھے کیسے معلوم ہو کہ یہ دھوکہ ہے؟",
        },
        "keywords": {
            "en": ["scam", "fraud", "suspicious", "fake", "is this safe", "cheat", "genuine", "real or fake"],
            "hi": ["ठगी", "धोखा", "फर्जी", "संदिग्झ", "क्या यह सही है"],
            "kn": ["ವಂಚನೆ", "ಸಂಶಯ", "ನಕಲಿ", "ಸರಿಯಾ ಎಂದು"],
            "ur": ["دھوکہ", "فراڈ", "جعلی", "مشکوک", "کیا یہ درست ہے"],
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
            "ur": (
                "ہوشیار رہیں اگر کوئی میسیج: آپ کا پن، او ٹی پی یا پاس ورڈ مانگے؛ خوف یا "
                "جلد بازی پیدا کرے؛ انعام یا کیش بیک کا لالچ دے؛ پیسے وصول کرنے کے لیے "
                "کیو آر اسکین کرنے کو کہے؛ یا نام اور رقم مختلف دکھائے۔ جب بھی شک ہو، رکیں اور تصدیق کریں۔"
            ),
        },
    },
    {
        "id": "about_app",
        "title": {
            "en": "About SAARTHI SafePay",
            "hi": "SAARTHI SafePay के बारे में",
            "kn": "SAARTHI SafePay ಬಗ್ಗೆ",
            "ur": "SAARTHI SafePay کے بارے میں",
        },
        "keywords": {
            "en": ["about this app", "what is this app", "saarthi", "safepay", "privacy", "does it access my bank"],
            "hi": ["ऐप क्या है", "सारथी", "क्या यह ऐप", "जानकारी लेता है"],
            "kn": ["ಈ ಆ್ಯಪ್ ಏನು", "ಸಾರಥಿ", "ಆ್ಯಪ್ ಬಗ್ಗೆ"],
            "ur": ["ایپ کیا ہے", "سارتھی", "حفاظت", "معلومات"],
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
            "ur": (
                "SAARTHI SafePay محفوظ ڈیجیٹل ادائیگیوں کے لیے ایک رہنمائی ایپ ہے۔ یہ صرف وہی "
                "معلومات پڑھتی ہے جو آپ جانچنے کے لیے دیتے ہیں، انتباہی علامات بتاتی ہے اور واضح اقدامات "
                "تجویز کرتی ہے۔ یہ کبھی آپ کا پن یا او ٹی پی نہیں مانگتی اور نہ ہی بینک ڈیٹا باہر بھیجتی ہے۔"
            ),
        },
    },
    {
        "id": "safe_habits",
        "title": {
            "en": "Five habits for safe payments",
            "hi": "सुरक्षित भुगतान की पाँच आदतें",
            "kn": "ಸುರಕ್ಷಿತ ಪಾವತಿಗೆ ಐದು ಅಭ್ಯಾಸಗಳು",
            "ur": "محفوظ ادائیگی کی پانچ عادات",
        },
        "keywords": {
            "en": ["tips", "habits", "how to stay safe", "advice", "prevent", "protect"],
            "hi": ["सुरक्षा टिप्स", "आदतें", "बचाव", "सलाह"],
            "kn": ["ಸಲಹೆ", "ಅಭ್ಯಾಸ", "ಹೇಗೆ ಸುರಕ್ಷಿತ", "ತಡೆ"],
            "ur": ["حفاظتی نکات", "عادات", "بچاؤ", "مشورہ"],
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
            "ur": (
                "1) اپنا یو پی آئی پن یا او ٹی پی کبھی کسی کو نہ بتائیں۔ 2) کیو آر کوڈ صرف ادائیگی "
                "کے لیے اسکین کریں، پیسے وصول کرنے کے لیے نہیں۔ 3) ہر بار وصول کنندہ کا نام اور رقم پڑھیں۔ "
                "4) ڈرانے یا جلد بازی والے پیغامات پر عمل نہ کریں۔ 5) شک ہونے پر رک جائیں اور سارتھی ایپ استعمال کریں۔"
            ),
        },
    },
    {
        "id": "phishing",
        "title": {
            "en": "What is Phishing?",
            "hi": "फ़िशिंग (Phishing) क्या है?",
            "kn": "ಫಿಶಿಂಗ್ ಎಂದರೇನು?",
            "ur": "فشنگ (Phishing) کیا ہے؟",
        },
        "keywords": {
            "en": [
                "phishing", "what is phishing", "fake link", "phishing attack", "phish",
                "fraudulent link", "phishing scam", "suspicious link"
            ],
            "hi": ["फ़िशिंग", "फिशिंग", "फ़िशिंग क्या है", "फर्जी लिंक", "नक़ली लिंक"],
            "kn": ["ಫಿಶಿಂಗ್", "ನಕಲಿ ಲಿಂಕ್", "ಫಿಶಿಂಗ್ ಎಂದರೇನು", "ಮೋಸದ ಲಿಂಕ್"],
            "ur": ["فشنگ", "فشنگ کیا ہے", "جعلی لنک", "مشکوک لنک"],
        },
        "answer": {
            "en": (
                "Phishing is a cyber scam where criminals send fake SMS, emails, or links pretending "
                "to be from your bank, electricity board, or government. Their goal is to trick you into "
                "revealing your UPI PIN, passwords, OTPs, or trick you into installing remote-access apps. "
                "Remember: legitimate banks and departments never send links asking you to enter your secret PIN or passwords."
            ),
            "hi": (
                "फ़िशिंग एक ऐसी ऑनलाइन ठगी है जिसमें धोखेबाज़ बैंक, बिजली विभाग या सरकारी संस्था का रूप धरकर "
                "नकली SMS या लिंक भेजते हैं। इनका लक्ष्य आपका UPI पिन, पासवर्ड या OTP चुराना होता है। हमेशा याद रखें: "
                "असली बैंक कभी लिंक भेजकर आपसे गुप्त पिन या पासवर्ड नहीं माँगते।"
            ),
            "kn": (
                "ಫಿಶಿಂಗ್ ಎಂದರೆ ವಂಚಕರು ನಿಮ್ಮ ಬ್ಯಾಂಕ್, ವಿದ್ಯುತ್ ಇಲಾಖೆ ಅಥವಾ ಸರ್ಕಾರದ ಹೆಸರಿನಲ್ಲಿ ನಕಲಿ ಲಿಂಕ್ ಅಥವಾ ಸಂದೇಶ "
                "ಕಳುಹಿಸಿ ವಂಚಿಸುವ ತಂತ್ರ. ನಿಮ್ಮ UPI ಪಿನ್, ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಒಟಿಪಿ ಕದಿಯುವುದು ಇವರ ಉದ್ದೇಶ. ನಿಜವಾದ ಸಂಸ್ಥೆಗಳು "
                "ಲಿಂಕ್ ಕಳುಹಿಸಿ ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಕೇಳುವುದಿಲ್ಲ."
            ),
            "ur": (
                "فشنگ ایک آن لائن دھوکہ ہے جس میں مجرم بینک، بجلی کے محکمے یا سرکاری ادارے کے بھیس میں "
                "جعلی ایس ایم ایس یا لنک بھیجتے ہیں۔ ان کا مقصد آپ کا پن، او ٹی پی یا پاس ورڈ چرانا ہوتا ہے۔ "
                "اصلی بینک کبھی لنک بھیج کر خفیہ کوڈ نہیں مانگتے۔"
            ),
        },
    },
    {
        "id": "digital_arrest",
        "title": {
            "en": "Digital Arrest Scam",
            "hi": "डिजिटल अरेस्ट (Digital Arrest) क्या है?",
            "kn": "ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಎಂದರೇನು?",
            "ur": "ڈیجیٹل اریسٹ (Digital Arrest) کیا ہے؟",
        },
        "keywords": {
            "en": [
                "digital arrest", "police call", "cbi", "video call arrest", "narcotics",
                "customs arrest", "skype arrest", "police arrest"
            ],
            "hi": ["डिजिटल अरेस्ट", "पुलिस कॉल", "सीबीआई", "वीडियो कॉल अरेस्ट", "गिरफ्तारी"],
            "kn": ["ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್", "ಪೊಲೀಸ್ ಕರೆ", "ವೀಡಿಯೊ ಕಾಲ್ ಅರೆಸ್ಟ್", "ಬಂಧನ"],
            "ur": ["ڈیجیٹل اریسٹ", "پولیس کال", "سی بی آئی", "ویڈیو کال گرفتاری", "گرفتاری"],
        },
        "answer": {
            "en": (
                "There is NO legal concept of 'digital arrest' in Indian law. Police, CBI, ED, and courts "
                "NEVER arrest anyone over WhatsApp, Skype, or video calls, and never demand money to clear cases. "
                "If someone dressed as a police officer threatens you on a video call, hang up immediately and dial 1930."
            ),
            "hi": (
                "भारतीय कानून में 'डिजिटल अरेस्ट' नाम की कोई चीज़ नहीं होती। पुलिस, सीबीआई या अदालतें वीडियो कॉल "
                "पर कभी किसी को गिरफ्तार नहीं करतीं और न ही केस रफ़ा-दफ़ा करने के लिए पैसे माँगती हैं। अगर कोई वीडियो कॉल "
                "पर पुलिस बनकर धमकी दे, तो तुरंत कॉल काटें और 1930 पर शिकायत करें।"
            ),
            "kn": (
                "ಭಾರತೀಯ ಕಾನೂನಿನಲ್ಲಿ 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್' ಎಂಬ ಯಾವುದೇ ನಿಯಮವಿಲ್ಲ. ಪೊಲೀಸ್ ಅಥವಾ ನ್ಯಾಯಾಲಯಗಳು ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ "
                "ಯಾರನ್ನೂ ಬಂಧಿಸುವುದಿಲ್ಲ ಮತ್ತು ಹಣ ಕೇಳುವುದಿಲ್ಲ. ಯಾರಾದರೂ ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಹೆದರಿಸಿದರೆ ತಕ್ಷಣ ಕಟ್ ಮಾಡಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ."
            ),
            "ur": (
                "ہندوستانی قانون میں 'ڈیجیٹل اریسٹ' نام کا کوئی تصور نہیں ہے۔ پولیس یا عدالتیں ویڈیو کال "
                "پر کسی کو گرفتار نہیں کرتیں اور نہ کیس ختم کرنے کے لیے رقم مانگتی ہیں۔ اگر کوئی ویڈیو کال پر "
                "پولیس بن کر دھمکی دے تو فوراً کال کاٹیں اور 1930 پر رابطہ کریں۔"
            ),
        },
    },
    {
        "id": "qr_safety_checklist",
        "title": {
            "en": "What to Check Before Paying",
            "hi": "भुगतान करने से पहले क्या जाँचें?",
            "kn": "ಪಾವತಿಸುವ ಮೊದಲು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?",
            "ur": "ادائیگی کرنے سے پہلے کیا جانچیں؟",
        },
        "keywords": {
            "en": [
                "what should i check before paying", "qr checklist", "check before paying",
                "payment checklist", "before payment", "what to check"
            ],
            "hi": ["भुगतान से पहले क्या देखें", "भुगतान चेकलिस्ट", "पैसे भेजने से पहले"],
            "kn": ["ಪಾವತಿಸುವ ಮೊದಲು ಏನು ನೋಡಬೇಕು", "ಪಾವತಿ ಚೆಕ್‌ಲಿಸ್ಟ್"],
            "ur": ["ادائیگی سے پہلے کیا دیکھیں", "چیک لسٹ", "پیسے بھیجنے سے پہلے"],
        },
        "answer": {
            "en": (
                "Before entering your UPI PIN: 1) Verify the exact merchant or beneficiary name on your screen. "
                "2) Confirm the exact amount in rupees. 3) Never enter your UPI PIN to receive money or claim refunds. "
                "4) If the name or amount does not match what you expected, cancel immediately."
            ),
            "hi": (
                "UPI पिन डालने से पहले: 1) स्क्रीन पर दिखने वाले दुकानदार या व्यक्ति का नाम ध्यान से पढ़ें। "
                "2) सही राशि (रुपये) की जाँच करें। 3) पैसे पाने या रिफंड के लिए कभी पिन न डालें। "
                "4) अगर नाम या राशि में थोड़ा भी अंतर दिखे, तो तुरंत रद्द करें।"
            ),
            "kn": (
                "UPI ಪಿನ್ ನಮೂದಿಸುವ ಮೊದಲು: 1) ಪರದೆಯಲ್ಲಿರುವ ಹೆಸರು ಸರಿಯಾಗಿದೆಯೇ ನೋಡಿ. 2) ನಿಖರ ಮೊತ್ತವನ್ನು ದೃಢೀಕರಿಸಿ. "
                "3) ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಿನ್ ನಮೂದಿಸಬೇಡಿ. 4) ಹೆಸರು ಅಥವಾ ಮೊತ್ತದಲ್ಲಿ ವ್ಯತ್ಯಾಸ ಕಂಡರೆ ತಕ್ಷಣ ರದ್ದುಗೊಳಿಸಿ."
            ),
            "ur": (
                "یو پی آئی پن درج کرنے سے پہلے: 1) اسکرین پر نظر آنے والا دکان دار یا شخص کا نام دھیان سے پڑھیں۔ "
                "2) درست رقم کی تصدیق کریں۔ 3) رقم پانے یا ریفنڈ کے لیے کبھی پن درج نہ کریں۔ "
                "4) نام یا رقم میں ذرا سا بھی فرق نظر آئے تو فوراً منسوخ کر دیں۔"
            ),
        },
    },
    {
        "id": "electricity_bill",
        "title": {
            "en": "Electricity Bill Cutoff Scam",
            "hi": "बिजली बिल कटने का फर्जी संदेश",
            "kn": "ವಿದ್ಯುತ್ ಬಿಲ್ ವಂಚನೆ ಸಂದೇಶ",
            "ur": "بجلی کا بل کٹنے کا جعلی پیغام",
        },
        "keywords": {
            "en": [
                "electricity", "power cutoff", "electricity bill", "bill pending",
                "power will be disconnected", "electricity disconnected"
            ],
            "hi": ["बिजली बिल", "बिजली कट जाएगी", "बिजली का बिल"],
            "kn": ["ವಿದ್ಯುತ್ ಬಿಲ್", "ವಿದ್ಯುತ್ ಕಡಿತ"],
            "ur": ["بجلی کا بل", "بجلی کٹ جائے گی", "بجلی منقطع"],
        },
        "answer": {
            "en": (
                "This is a very common scam. Power departments never send SMS from 10-digit mobile numbers "
                "saying power will be disconnected at 9:30 PM, nor do they tell you to call an officer's phone number. "
                "Never call the number in such SMS or download any app."
            ),
            "hi": (
                "यह एक बहुत आम धोखा है। बिजली विभाग कभी भी निजी मोबाइल नंबर से आज रात बिजली कटने का संदेश नहीं भेजता, "
                "न ही किसी अधिकारी को कॉल करने को कहता है। ऐसे संदेश में दिए गए नंबर पर कभी कॉल न करें और कोई ऐप डाउनलोड न करें।"
            ),
            "kn": (
                "ಇದು ಸಾಮಾನ್ಯ ವಂಚನೆ. ವಿದ್ಯುತ್ ಮಂಡಳಿಯು ವೈಯಕ್ತಿಕ ಮೊಬೈಲ್‌ನಿಂದ ರಾತ್ರಿ ವಿದ್ಯುತ್ ಕಡಿತವಾಗುತ್ತದೆ ಎಂದು "
                "ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ. ಅಂತಹ ಸಂದೇಶದಲ್ಲಿರುವ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಬೇಡಿ."
            ),
            "ur": (
                "یہ ایک عام دھوکہ ہے۔ بجلی کا محکمہ کبھی عام موبائل نمبر سے رات کو بجلی کٹنے کا میسیج "
                "نہیں بھیجتا اور نہ کسی پرائیویٹ نمبر پر کال کرنے کو کہتا ہے۔ ایسے میسیج میں دیے گئے نمبر پر کبھی کال نہ کریں اور نہ کوئی ایپ ڈاؤن لوڈ کریں۔"
            ),
        },
    },
    {
        "id": FALLBACK_ID,
        "title": {
            "en": "Ask something else",
            "hi": "कुछ और पूछें",
            "kn": "ಬೇರೆ ಏನಾದರೂ ಕೇಳಿ",
            "ur": "کچھ اور پوچھیں",
        },
        "keywords": {"en": [], "hi": [], "kn": [], "ur": []},
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
            "ur": (
                "میں ان معاملات میں مدد کر سکتا ہوں: یو پی آئی پن اور او ٹی پی کی حفاظت، کیو آر کوڈ "
                "کی جانچ، رقم وصول کرنا، مشکوک کالز یا پیغامات، اور غلط ادائیگی کے بعد کیا اقدامات کریں۔ "
                "براہ کرم اپنا سوال لکھیں یا تجاویز پر ٹیپ کریں۔"
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
    text: str,
    language: str = "en",
    topic_id: str | None = None,
    context: str | None = None,
) -> dict[str, Any]:
    """Match a question to a curated topic or analyze messages using the ML pipeline.

    - If context is provided and user asks follow-up ("Why is it suspicious?", "What should I do?"),
      explains the actual findings from the previous analysis.
    - If topic_id is provided, answers directly from curated knowledge.
    - If the user provides an SMS/message for evaluation or asks about a message containing
      fraud patterns, analyzes it dynamically using the ML message analysis service.
    - Retains curated FAQs as a reliable fallback for conceptual payment safety questions.
    """
    from .ml.service import get_message_analysis_service

    lang = language if language in ("en", "hi", "kn", "ur") else "en"
    clean_text = text.strip()
    normalized = _normalize(clean_text)

    # 1. Contextual follow-up reasoning:
    # If the user asks "Why is this message dangerous?", "Why did you mark my message as suspicious?",
    # "Why is it suspicious?", "Explain that again", "What should I check before paying?", "Tell me what I should do"
    is_followup = any(
        phrase in clean_text.lower()
        for phrase in (
            "why is it suspicious",
            "why is this suspicious",
            "why did you mark",
            "why suspicious",
            "why dangerous",
            "why is this dangerous",
            "why it is dangerous",
            "explain that",
            "what should i do",
            "what should i check",
            "tell me what to do",
            "tell me what i should do",
            "clarify",
            "यह संदिग्ध क्यों है",
            "यह खतरनाक क्यों है",
            "मुझे क्या करना चाहिए",
            "ಇದು ಏಕೆ ಅನುಮಾನಾಸ್ಪದ",
            "ಇದು ಏಕೆ ಅಪಾಯಕಾರಿ",
            "ನಾನು ಏನು ಮಾಡಬೇಕು",
            "یہ مشکوک کیوں ہے",
            "یہ خطرناک کیوں ہے",
            "مجھے کیا کرنا چاہیے",
            "وضاحت کریں",
        )
    )

    if (context and is_followup) or (context and len(clean_text) < 45 and ("why" in clean_text.lower() or "explain" in clean_text.lower())):
        title_map = {
            "en": "Safety Findings Explanation",
            "hi": "सुरक्षा निष्कर्ष स्पष्टीकरण",
            "kn": "ಸುರಕ್ಷತಾ ವಿವರಣೆ",
            "ur": "حفاظتی نتائج کی وضاحت",
        }
        clean_ctx = context.strip()
        answer_en = (
            f"Based on your recent safety analysis:\n\n{clean_ctx}\n\n"
            "This was flagged because it triggered safety rules or matches known scam patterns. "
            "Safe next steps: Do NOT send money, do not scan any QR to receive funds, and never share your UPI PIN or OTP."
        )
        answer_hi = (
            f"आपके हालिया सुरक्षा विश्लेषण के आधार पर:\n\n{clean_ctx}\n\n"
            "हमारे सिस्टम ने इसे इसलिए संदिग्ध माना क्योंकि इसमें सुरक्षा नियमों का उल्लंघन या ठगी के ज्ञात संकेत पाए गए हैं। "
            "सुरक्षित अगला कदम: पैसे न भेजें, पैसे पाने के लिए कोई QR स्कैन न करें और कभी भी अपना UPI पिन या OTP साझा न करें।"
        )
        answer_kn = (
            f"ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಸುರಕ್ಷತಾ ಪರಿಶೀಲನೆಯ ಆಧಾರದ ಮೇಲೆ:\n\n{clean_ctx}\n\n"
            "ಸುರಕ್ಷತಾ ನಿಯಮಗಳ ಉಲ್ಲಂಘನೆ ಅಥವಾ ವಂಚನೆಯ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದ ಕಾರಣ ಇದನ್ನು ಎಚ್ಚರಿಕೆಯೊಂದಿಗೆ ಗುರುತಿಸಲಾಗಿದೆ. "
            "ಮುಂದಿನ ಕ್ರಮ: ದಯವಿಟ್ಟು ಹಣ ಕಳುಹಿಸಬೇಡಿ, ಹಣ ಪಡೆಯಲು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ ಮತ್ತು ನಿಮ್ಮ UPI ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
        )
        answer_ur = (
            f"آپ کے حالیہ حفاظتی تجزیے کی بنیاد پر:\n\n{clean_ctx}\n\n"
            "اسے اس لیے مشکوک قرار دیا گیا کیونکہ اس میں حفاظتی اصولوں کی خلاف ورزی یا دھوکہ دہی کے طریقے پائے گئے ہیں۔ "
            "محفوظ اگلا قدم: رقم ہرگز نہ بھیجیں، پیسے وصول کرنے کے لیے کوئی کیو آر اسکین نہ کریں اور اپنا یو پی آئی پن یا او ٹی پی کبھی شیئر نہ کریں۔"
        )
        ans_map = {"en": answer_en, "hi": answer_hi, "kn": answer_kn, "ur": answer_ur}

        suggested_ids = ["qr_safety_checklist", "otp", "already_paid"]
        return {
            "topic_id": "contextual_followup",
            "question": clean_text,
            "title": title_map.get(lang, title_map["en"]),
            "answer": ans_map.get(lang, answer_en),
            "suggested": [
                {
                    "topic_id": cid,
                    "title": _pick(TOPICS_BY_ID[cid]["title"], TOPICS_BY_ID[cid]["title"], lang),
                }
                for cid in suggested_ids
                if cid in TOPICS_BY_ID
            ],
            "language": lang,
            "answered_by": "contextual_followup",
        }

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
                "ur": f"پیغام کا حفاظتی تجزیہ: زیادہ خطرہ ({ml_res['category']})",
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

