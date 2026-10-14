"""Human-readable strings for the security engine, in English, Hindi and Kannada.

The engine returns sentences already localised so that "Listen to Explanation"
speaks the user's language. Rule identifiers stay stable English codes so the
API contract never changes with language.
"""

from __future__ import annotations

from typing import Any

# --- English -----------------------------------------------------------------

_EN: dict[str, Any] = {
    "outcomes": {
        "low_concern": {
            "label": "Low Concern",
            "summary": "No warning signs we check for were found.",
            "explanation": (
                "We ran our checks and none of the configured warning signs were "
                "found. This is not a safety guarantee - always confirm the payee "
                "name and amount in your payment app before you approve."
            ),
        },
        "be_careful": {
            "label": "Be Careful",
            "summary": "Something needs checking before you go ahead.",
            "explanation": (
                "Some checks need your attention before you pay: {signs}. "
                "Please check each point, and continue only if everything looks right."
            ),
        },
        "high_concern": {
            "label": "High Concern",
            "summary": "Serious warning signs detected - we recommend you stop.",
            "explanation": (
                "Serious warning signs were detected: {signs}. We recommend that "
                "you stop and do not make this payment."
            ),
        },
        "unable_to_verify": {
            "label": "Unable to Verify",
            "summary": "There is not enough clear information to check.",
            "explanation": (
                "We could not read enough clear payment information to check this. "
                "{reasons} Do not pay until someone you trust has checked it."
            ),
        },
    },
    "rules": {
        "SECRET_REQUEST": {
            "title": "Asks for a PIN, OTP or password",
            "detail": (
                "The data asks for a secret such as a PIN, OTP or password. Your "
                "bank will never ask for these. Never share them with anyone."
            ),
        },
        "URGENCY_PRESSURE": {
            "title": "Urgency or threats",
            "detail": (
                "It pushes you to act immediately or warns of blocked accounts, "
                "police action or penalties. Scammers apply pressure so you do not "
                "stop to think."
            ),
        },
        "INTENT_MISMATCH": {
            "title": "Payment direction does not match",
            "detail_receive": (
                "You said you want to receive money, but this QR starts a payment "
                "FROM your account."
            ),
            "detail_claim": (
                "The message says you will receive money, but this QR starts a "
                "payment from your account."
            ),
            "detail": "The payment direction does not match what you described.",
        },
        "AMOUNT_MISMATCH": {
            "title": "Amount does not match",
            "detail": (
                "The QR shows {qr_amount} but you expected {expected_amount}. "
                "A wrong amount is a common sign of a scam."
            ),
        },
        "AMOUNT_NOT_SHOWN": {
            "title": "Amount is not shown in the QR",
            "detail": (
                "You expect to pay {expected_amount}, but this QR does not show an "
                "amount. Check the amount carefully on the payment screen before "
                "you approve."
            ),
        },
        "AMOUNT_HIGH": {
            "title": "Unusually large amount",
            "detail": (
                "This QR asks for {qr_amount}, which is a large amount. Please "
                "confirm the total with the shop or person before you pay."
            ),
        },
        "INVALID_VPA": {
            "title": "Payment address looks wrong",
            "detail": (
                "The payment address in this code does not look like a valid UPI ID "
                "(for example, name@bank). We cannot check it reliably."
            ),
        },
        "UNSUPPORTED_INFO": {
            "title": "Not enough payment information",
            "detail": (
                "This does not contain payment details we can check - it may be a "
                "website link or text without a payment address."
            ),
        },
        "INTENT_UNKNOWN": {
            "title": "Purpose not confirmed",
            "detail": (
                "We do not know whether you want to pay or receive money. Please "
                "choose one so we can check the QR correctly."
            ),
        },
    },
    "status_labels": {
        "triggered": "Warning sign found",
        "clear": "Checked - no problem",
        "not_applicable": "Not applicable",
    },
    "actions": {
        "low_concern": [
            "If this is the payment you intended, you may continue in your own payment app.",
            "Before you enter your PIN, confirm the payee name and the exact amount on the confirmation screen.",
            "Never share your UPI PIN or OTP with anyone, for any reason.",
            "If anything feels wrong, stop and use Safety SOS.",
        ],
        "be_careful": [
            "Pause. Do not approve the payment yet.",
            "Check each warning sign above against what you expected.",
            "Confirm with the shop or person using a phone number you already have - not a number given in the message.",
            "Check the payee name and amount carefully on the payment screen.",
            "If you are still unsure, do not pay. Use Safety SOS or ask someone you trust.",
        ],
        "high_concern": [
            "Stop. Do not make this payment.",
            "Do not scan this QR again, and do not share your PIN, OTP or password with anyone.",
            "If you already paid, call your bank immediately on its official number and ask to block the transaction.",
            "Report online fraud on the cyber crime helpline 1930 or at cybercrime.gov.in.",
            "Change your UPI PIN and app passwords if you shared any details.",
        ],
        "unable_to_verify": [
            "Do not pay until someone you trust has checked this.",
            "Ask the sender to share the details clearly, or type the UPI ID yourself and verify the name.",
            "Try manual entry in this app, or open a demo scenario to see how the checks work.",
            "Never share your UPI PIN or OTP to 'verify' anything.",
            "If you feel pressured, open Safety SOS.",
        ],
    },
    "reasons": {
        "empty": "No information was found.",
        "no_payment_info": "The text does not contain payment information.",
        "missing_payee": "No payment address (UPI ID) was found.",
        "invalid_payee": "The payment address does not look valid.",
        "unknown_bank_handle": "The bank handle after '@' is not recognized as an authorized Indian bank or UPI provider.",
        "unsupported_link": "Website links are not supported for safety checks.",
    },
    "disclaimer": (
        "This is a guidance tool. We cannot confirm that a recipient is genuine, "
        "and no result guarantees that a payment is safe."
    ),
}

# --- Hindi -------------------------------------------------------------------

_HI: dict[str, Any] = {
    "outcomes": {
        "low_concern": {
            "label": "कम चिंता",
            "summary": "हमारी जाँच में कोई चेतावनी का संकेत नहीं मिला।",
            "explanation": (
                "हमने अपनी जाँच की और तय किए गए किसी भी चेतावनी संकेत का पता नहीं "
                "चला। यह सुरक्षा की गारंटी नहीं है - भुगतान स्वीकार करने से पहले "
                "अपने भुगतान ऐप में पाने वाले व्यक्ति का नाम और राशि ज़रूर जाँचें।"
            ),
        },
        "be_careful": {
            "label": "सावधान रहें",
            "summary": "आगे बढ़ने से पहले कुछ बातें जाँचनी होंगी।",
            "explanation": (
                "भुगतान से पहले कुछ बातों पर ध्यान देने की ज़रूरत है: {signs}। "
                "कृपया हर बात जाँचें, और सब कुछ ठीक लगने पर ही आगे बढ़ें।"
            ),
        },
        "high_concern": {
            "label": "अधिक चिंता",
            "summary": "गंभीर चेतावनी के संकेत मिले - हमारा सुझाव है कि रुक जाएँ।",
            "explanation": (
                "गंभीर चेतावनी के संकेत मिले: {signs}। हमारा सुझाव है कि आप रुक "
                "जाएँ और यह भुगतान न करें।"
            ),
        },
        "unable_to_verify": {
            "label": "सत्यापित नहीं कर सके",
            "summary": "जाँच के लिए पर्याप्त स्पष्ट जानकारी नहीं है।",
            "explanation": (
                "जाँच के लिए पर्याप्त स्पष्ट भुगतान जानकारी नहीं मिली। {reasons} "
                "किसी भरोसेमंद व्यक्ति से जाँच करवाने तक भुगतान न करें।"
            ),
        },
    },
    "rules": {
        "SECRET_REQUEST": {
            "title": "पिन, ओटीपी या पासवर्ड माँगा जा रहा है",
            "detail": (
                "डेटा में पिन, ओटीपी या पासवर्ड जैसी गोपनीय जानकारी माँगी गई है। "
                "बैंक कभी भी ऐसी जानकारी नहीं माँगता। इसे किसी के साथ साझा न करें।"
            ),
        },
        "URGENCY_PRESSURE": {
            "title": "जल्दबाज़ी या धमकी",
            "detail": (
                "यह तुरंत काम करने का दबाव डालता है या खाता ब्लॉक होने, पुलिस "
                "कार्रवाई या जुर्माने की धमकी देता है। ठग दबाव बनाते हैं ताकि आप "
                "सोच-समझ कर काम न करें।"
            ),
        },
        "INTENT_MISMATCH": {
            "title": "भुगतान की दिशा मेल नहीं खाती",
            "detail_receive": (
                "आपने कहा कि आपको पैसे प्राप्त करने हैं, लेकिन यह क्यूआर आपके खाते "
                "से भुगतान शुरू करता है।"
            ),
            "detail_claim": (
                "संदेश कहता है कि आपको पैसे मिलेंगे, लेकिन यह क्यूआर आपके खाते से "
                "भुगतान शुरू करता है।"
            ),
            "detail": "भुगतान की दिशा आपके बताए अनुसार मेल नहीं खाती।",
        },
        "AMOUNT_MISMATCH": {
            "title": "राशि मेल नहीं खाती",
            "detail": (
                "क्यूआर में {qr_amount} दिख रहा है, जबकि आपने {expected_amount} "
                "अपेक्षित किया था। गलत राशि ठगी का आम संकेत है।"
            ),
        },
        "AMOUNT_NOT_SHOWN": {
            "title": "क्यूआर में राशि नहीं दिख रही",
            "detail": (
                "आप {expected_amount} देने की उम्मीद कर रहे हैं, लेकिन इस क्यूआर "
                "में कोई राशि नहीं है। स्वीकार करने से पहले भुगतान स्क्रीन पर राशि "
                "ध्यान से जाँचें।"
            ),
        },
        "AMOUNT_HIGH": {
            "title": "बहुत बड़ी राशि",
            "detail": (
                "यह क्यूआर {qr_amount} माँग रहा है, जो एक बड़ी राशि है। भुगतान से "
                "पहले दुकान या व्यक्ति से कुल राशि की पुष्टि करें।"
            ),
        },
        "INVALID_VPA": {
            "title": "भुगतान पता सही नहीं लगता",
            "detail": (
                "इस कोड में मिला भुगतान पता मान्य UPI आईडी (जैसे, name@bank) "
                "जैसा नहीं लगता। हम इसकी भरोसेमंद जाँच नहीं कर सकते।"
            ),
        },
        "UNSUPPORTED_INFO": {
            "title": "पर्याप्त भुगतान जानकारी नहीं",
            "detail": (
                "इसमें वह भुगतान जानकारी नहीं है जिसे हम जाँच सकें - यह कोई "
                "वेबसाइट लिंक या बिना भुगतान पते का टेक्स्ट हो सकता है।"
            ),
        },
        "INTENT_UNKNOWN": {
            "title": "मकसद स्पष्ट नहीं",
            "detail": (
                "हमें नहीं पता कि आप भुगतान करना चाहते हैं या पैसे प्राप्त करना। "
                "क्यूआर की सही जाँच के लिए कृपया एक विकल्प चुनें।"
            ),
        },
    },
    "status_labels": {
        "triggered": "चेतावनी का संकेत मिला",
        "clear": "जाँच की गई - कोई समस्या नहीं",
        "not_applicable": "लागू नहीं",
    },
    "actions": {
        "low_concern": [
            "अगर यह वही भुगतान है जो आप करना चाहते थे, तो आप अपने भुगतान ऐप में आगे बढ़ सकते हैं।",
            "पिन डालने से पहले पुष्टि स्क्रीन पर पाने वाले का नाम और सही राशि जाँचें।",
            "किसी भी कारण से अपना UPI पिन या OTP किसी को न बताएं।",
            "अगर कुछ ठीक न लगे तो रुक जाएँ और Safety SOS का उपयोग करें।",
        ],
        "be_careful": [
            "रुकें। अभी भुगतान स्वीकार न करें।",
            "ऊपर दी गई हर चेतावनी को अपनी उम्मीद से मिलाएँ।",
            "दुकान या व्यक्ति से उस नंबर पर पुष्टि करें जो आपके पास पहले से है - संदेश में दिए गए नंबर पर नहीं।",
            "भुगतान स्क्रीन पर पाने वाले का नाम और राशि ध्यान से जाँचें।",
            "अगर फिर भी शक हो तो भुगतान न करें। Safety SOS खोलें या किसी भरोसेमंद व्यक्ति से पूछें।",
        ],
        "high_concern": [
            "रुक जाएँ। यह भुगतान न करें।",
            "इस क्यूआर को दोबारा स्कैन न करें और अपना पिन, OTP या पासवर्ड किसी को न बताएँ।",
            "अगर आप भुगतान कर चुके हैं, तो तुरंत बैंक के आधिकारिक नंबर पर कॉल करके लेन-देन रोकने को कहें।",
            "साइबर अपराध हेल्पलाइन 1930 या cybercrime.gov.in पर शिकायत करें।",
            "अगर आपने कोई जानकारी दे दी है, तो अपना UPI पिन और ऐप पासवर्ड बदल दें।",
        ],
        "unable_to_verify": [
            "किसी भरोसेमंद व्यक्ति से जाँच करवाने तक भुगतान न करें।",
            "भेजने वाले से जानकारी स्पष्ट रूप से मँगवाएँ, या UPI आईडी खुद डालकर नाम की पुष्टि करें।",
            "इस ऐप में मैनुअल एंट्री आज़माएँ, या डेमो स्थितियों से समझें कि जाँच कैसे काम करती है।",
            "'पुष्टि' के नाम पर अपना UPI पिन या OTP किसी को न बताएँ।",
            "अगर जल्दबाज़ी महसूस हो रही है तो Safety SOS खोलें।",
        ],
    },
    "reasons": {
        "empty": "कोई जानकारी नहीं मिली।",
        "no_payment_info": "टेक्स्ट में भुगतान की जानकारी नहीं है।",
        "missing_payee": "भुगतान पता (UPI आईडी) नहीं मिला।",
        "invalid_payee": "भुगतान पता मान्य नहीं लगता।",
        "unknown_bank_handle": "'@' के बाद वाला बैंक हैंडल किसी मान्यता प्राप्त भारतीय बैंक या UPI प्रदाता का नहीं है।",
        "unsupported_link": "सुरक्षा जाँच के लिए वेबसाइट लिंक समर्थित नहीं हैं।",
    },
    "disclaimer": (
        "यह एक मार्गदर्शन उपकरण है। हम यह पुष्टि नहीं कर सकते कि प्राप्तकर्ता "
        "वास्तविक है, और कोई भी परिणाम भुगतान की सुरक्षा की गारंटी नहीं देता।"
    ),
}

# --- Kannada -----------------------------------------------------------------

_KN: dict[str, Any] = {
    "outcomes": {
        "low_concern": {
            "label": "ಕಡಿಮೆ ಆತಂಕ",
            "summary": "ನಮ್ಮ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಸೂಚನೆ ಸಿಗಲಿಲ್ಲ.",
            "explanation": (
                "ನಾವು ಪರಿಶೀಲನೆ ನಡೆಸಿದೆವು ಮತ್ತು ನಿಗದಿತ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳು "
                "ಕಂಡುಬಂದಿಲ್ಲ. ಇದು ಸುರಕ್ಷತೆಯ ಖಾತರಿ ಅಲ್ಲ - ಪಾವತಿ ಒಪ್ಪಿಸುವ ಮೊದಲು "
                "ನಿಮ್ಮ ಪಾವತಿ ಆ್ಯಪ್‌ನಲ್ಲಿ ಪಡೆಯುವ ವ್ಯಕ್ತಿಯ ಹೆಸರು ಮತ್ತು ಮೊತ್ತವನ್ನು "
                "ಖಂಡಿತ ಪರಿಶೀಲಿಸಿ."
            ),
        },
        "be_careful": {
            "label": "ಎಚ್ಚರಿಕೆ ವಹಿಸಿ",
            "summary": "ಮುಂದುವರಿಯುವ ಮೊದಲು ಕೆಲವು ವಿಷಯಗಳನ್ನು ಪರಿಶೀಲಿಬೇಕು.",
            "explanation": (
                "ಪಾವತಿಗೂ ಮೊದಲು ಕೆಲವು ವಿಷಯಗಳ ಗಮನ ಬೇಕು: {signs}. ದಯವಿಟ್ಟು ಪ್ರತಿ "
                "ವಿಷಯವನ್ನು ಪರಿಶೀಲಿಸಿ, ಎಲ್ಲವೂ ಸರಿ ಕಂಡರು ಮಾತ್ರ ಮುಂದುವರಿಸಿ."
            ),
        },
        "high_concern": {
            "label": "ಹೆಚ್ಚು ಆತಂಕ",
            "summary": "ಗಂಭೀರ ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳು ಸಿಕ್ಕಿವೆ - ನಿಲ್ಲುವಂತೆ ನಮ್ಮ ಸಲಹೆ.",
            "explanation": (
                "ಗಂಭೀರ ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳು ಸಿಕ್ಕಿವೆ: {signs}. ನೀವು ನಿಲ್ಲಿ ಈ "
                "ಪಾವತಿ ಮಾಡಬೇಡಿ ಎಂದು ನಮ್ಮ ಸಲಹೆ."
            ),
        },
        "unable_to_verify": {
            "label": "ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
            "summary": "ಪರಿಶೀಲನೆಗೆ ಸಾಕಷ್ಟು ಸ್ಪಷ್ಟ ಮಾಹಿತಿ ಇಲ್ಲ.",
            "explanation": (
                "ಪರಿಶೀಲನೆಗೆ ಸಾಕಷ್ಟು ಸ್ಪಷ್ಟ ಪಾವತಿ ಮಾಹಿತಿ ಸಿಗಲಿಲ್ಲ. {reasons} "
                "ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿ ಪರಿಶೀಲಿಸುವವರೆಗೆ ಪಾವತಿ ಮಾಡಬೇಡಿ."
            ),
        },
    },
    "rules": {
        "SECRET_REQUEST": {
            "title": "ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳಲಾಗುತ್ತಿದೆ",
            "detail": (
                "ಡೇಟಾದಲ್ಲಿ ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಮುಂತಾದ ರಹಸ್ಯ ಕೇಳಲಾಗಿದೆ. "
                "ಬ್ಯಾಂಕ್ ಎಂದಿಗೂ ಇಂತಹ ಮಾಹಿತಿ ಕೇಳುವುದಿಲ್ಲ. ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
            ),
        },
        "URGENCY_PRESSURE": {
            "title": "ಅವಸರ ಅಥವಾ ಬೆದರಿಕೆ",
            "detail": (
                "ತಕ್ಷಣ ಕೆಲಸ ಮಾಡಲು ಒತ್ತಡ ಹಾಕುತ್ತದೆ ಅಥವಾ ಖಾತೆ ನಿರ್ಬಂಧ, ಪೊಲೀಸ್ ಕ್ರಮ "
                "ಅಥವಾ ದಂಡದ ಬೆದರಿಕೆ ನೀಡುತ್ತದೆ. ವಂಚಕರು ಒತ್ತಡ ಹಾಕಿ ನೀವು ಯೋಚಿಸದಂತೆ "
                "ಮಾಡುತ್ತಾರೆ."
            ),
        },
        "INTENT_MISMATCH": {
            "title": "ಪಾವತಿ ದಿಕ್ಕು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ",
            "detail_receive": (
                "ನೀವು ಹಣ ಪಡೆಯಬೇಕೆಂದು ಹೇಳಿದ್ದೀರಿ, ಆದರೆ ಈ QR ನಿಮ್ಮ ಖಾತೆಯಿಂದ "
                "ಪಾವತಿ ಪ್ರಾರಂಭಿಸುತ್ತದೆ."
            ),
            "detail_claim": (
                "ಸಂದೇಶದಲ್ಲಿ ನಿಮಗೆ ಹಣ ಬರುತ್ತದೆ ಎಂದಿದೆ, ಆದರೆ ಈ QR ನಿಮ್ಮ ಖಾತೆಯಿಂದ "
                "ಪಾವತಿ ಪ್ರಾರಂಭಿಸುತ್ತದೆ."
            ),
            "detail": "ಪಾವತಿ ದಿಕ್ಕು ನೀವು ಹೇಳಿದಂತೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
        },
        "AMOUNT_MISMATCH": {
            "title": "ಮೊತ್ತ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ",
            "detail": (
                "QR ನಲ್ಲಿ {qr_amount} ಕಾಣಿಸುತ್ತಿದೆ, ಆದರೆ ನೀವು {expected_amount} "
                "ನಿರೀಕ್ಷಿಸಿದ್ದಿರಿ. ತಪ್ಪು ಮೊತ್ತ ವಂಚನೆಯ ಸಾಮಾನ್ಯ ಸೂಚನೆ."
            ),
        },
        "AMOUNT_NOT_SHOWN": {
            "title": "QR ನಲ್ಲಿ ಮೊತ್ತ ಕಾಣಿಸುತ್ತಿಲ್ಲ",
            "detail": (
                "ನೀವು {expected_amount} ಪಾವತಿಸುವ ನಿರೀಕ್ಷೆಯಲ್ಲಿದ್ದೀರಿ, ಆದರೆ ಈ QR "
                "ನಲ್ಲಿ ಯಾವುದೇ ಮೊತ್ತ ಇಲ್ಲ. ಒಪ್ಪಿಸುವ ಮೊದಲು ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ಮೊತ್ತವನ್ನು "
                "ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ."
            ),
        },
        "AMOUNT_HIGH": {
            "title": "ಅತಿ ದೊಡ್ಡ ಮೊತ್ತ",
            "detail": (
                "ಈ QR {qr_amount} ಕೇಳುತ್ತಿದೆ, ಇದು ದೊಡ್ಡ ಮೊತ್ತ. ಪಾವತಿಗೂ ಮೊದಲು "
                "ಅಂಗಡಿ ಅಥವಾ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಒಟ್ಟು ಮೊತ್ತ ಖಚಿತಪಡಿಸಿ."
            ),
        },
        "INVALID_VPA": {
            "title": "ಪಾವತಿ ವಿಳಾಸ ಸರಿಯಾಗಿ ಕಾಣುತ್ತಿಲ್ಲ",
            "detail": (
                "ಈ ಕೋಡ್‌ನಲ್ಲಿನ ಪಾವತಿ ವಿಳಾಸ ಮಾನ್ಯ UPI ಐಡಿ (ಉದಾ., name@bank) "
                "ರೀತಿಯಲ್ಲಿ ಕಾಣುತ್ತಿಲ್ಲ. ನಾವು ಅದನ್ನು ವಿಶ್ವಾಸಾರ್ಯವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗುವುದಿಲ್ಲ."
            ),
        },
        "UNSUPPORTED_INFO": {
            "title": "ಸಾಕಷ್ಟು ಪಾವತಿ ಮಾಹಿತಿ ಇಲ್ಲ",
            "detail": (
                "ನಾವು ಪರಿಶೀಲಿಸಬಹುದಾದ ಪಾವತಿ ಮಾಹಿತಿ ಇದರಲ್ಲಿ ಇಲ್ಲ - ಇದು ಜಾಲತಾಣ "
                "ಕೊಂಡಿ ಅಥವಾ ಪಾವತಿ ವಿಳಾಸವಿಲ್ಲದ ಪಠ್ಯವಾಗಿರಬಹುದು."
            ),
        },
        "INTENT_UNKNOWN": {
            "title": "ಉದ್ದೇಶ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ",
            "detail": (
                "ನೀವು ಪಾವತಿಸಲು ಬಯಸುತ್ತೀರಾ ಅಥವಾ ಹಣ ಪಡೆಯಲು ಬಯಸುತ್ತೀರಾ ಎಂದು ನಮಗೆ "
                "ಗೊತ್ತಿಲ್ಲ. QR ಅನ್ನು ಸರಿಯಾಗಿ ಪರಿಶೀಲಿಸಲು ದಯವಿಟ್ಟು ಒಂದು ಆಯ್ಕೆ ಮಾಡಿ."
            ),
        },
    },
    "status_labels": {
        "triggered": "ಎಚ್ಚರಿಕೆ ಸೂಚನೆ ಸಿಕ್ತು",
        "clear": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ - ಸಮಸ್ಯೆ ಇಲ್ಲ",
        "not_applicable": "ಅನ್ವಯವಾಗುವುದಿಲ್ಲ",
    },
    "actions": {
        "low_concern": [
            "ಇದು ನೀವು ಮಾಡಲು ಬಯಸಿದ್ದ ಪಾವತಿಯೇ ಆದರೆ, ನಿಮ್ಮ ಪಾವತಿ ಆ್ಯಪ್‌ನಲ್ಲಿ ಮುಂದುವರಿಸಬಹುದು.",
            "ಪಿನ್ ನಮೂದಿಸುವ ಮೊದಲು ದೃಢೀಕರಣ ಪರದೆಯಲ್ಲಿ ಪಡೆಯುವವರ ಹೆಸರು ಮತ್ತು ನಿಖರ ಮೊತ್ತವನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ಯಾವುದೇ ಕಾರಣಕ್ಕೂ ನಿಮ್ಮ UPI ಪಿನ್ ಅಥವಾ ಒಟಿಪಿಯನ್ನು ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.",
            "ಏನಾದರೂ ಸರಿ ಕಂಡರೆ ನಿಲ್ಲಿ ಮತ್ತು Safety SOS ಬಳಸಿ.",
        ],
        "be_careful": [
            "ನಿಲ್ಲಿ. ಈಗ ಪಾವತಿ ಒಪ್ಪಿಸಬೇಡಿ.",
            "ಮೇಲಿನ ಪ್ರತಿಯೊಂದು ಎಚ್ಚರಿಕೆಯನ್ನು ನಿಮ್ಮ ನಿರೀಕ್ಷೆಯೊಂದಿಗೆ ಹೋಲಿಸಿ.",
            "ಅಂಗಡಿ ಅಥವಾ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ಬಳಿ ಈಗಾಗಲೇ ಇರುವ ನಂಬರ್‌ನಲ್ಲಿ ದೃಢೀಕರಿಸಿ - ಸಂದೇಶದಲ್ಲಿ ನೀಡಿದ ನಂಬರ್‌ನಲ್ಲಿ ಅಲ್ಲ.",
            "ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ಪಡೆಯುವವರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತವನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
            "ಇನ್ನೂ ಅನುಮಾನವಿದ್ದರೆ ಪಾವತಿ ಮಾಡಬೇಡಿ. Safety SOS ತೆರೆಯಿರಿ ಅಥವಾ ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯನ್ನು ಕೇಳಿ.",
        ],
        "high_concern": [
            "ನಿಲ್ಲಿ. ಈ ಪಾವತಿ ಮಾಡಬೇಡಿ.",
            "ಈ QR ಅನ್ನು ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ ಮತ್ತು ಪಿನ್, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.",
            "ಈಗಾಗಲೇ ಪಾವತಿಸಿದ್ದರೆ, ತಕ್ಷಣ ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ ವಹಿವಾಟು ನಿಲ್ಲಿಸಲು ಕೇಳಿ.",
            "ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಿ.",
            "ನೀವು ಮಾಹಿತಿ ನೀಡಿದ್ದರೆ, ನಿಮ್ಮ UPI ಪಿನ್ ಮತ್ತು ಆ್ಯಪ್ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ.",
        ],
        "unable_to_verify": [
            "ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿ ಪರಿಶೀಲಿಸುವವರೆಗೆ ಪಾವತಿ ಮಾಡಬೇಡಿ.",
            "ಕಳುಹಿಸಿದವರಿಂದ ಮಾಹಿತಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿ, ಅಥವಾ UPI ಐಡಿಯನ್ನು ನೀವೇ ನಮೂದಿಸಿ ಹೆಸರು ಪರಿಶೀಲಿಸಿ.",
            "ಈ ಆ್ಯಪ್‌ನ ಕೈಮುಖ ನಮೂದಿ ಬಳಸಿ, ಅಥವಾ ಡೆಮೊ ಸನ್ನಿವೇಶಗಳಿಂದ ಪರಿಶೀಲನೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ನೋಡಿ.",
            "'ದೃಢೀಕರಣಕ್ಕಾಗಿ' ನಿಮ್ಮ UPI ಪಿನ್ ಅಥವಾ ಒಟಿಪಿಯನ್ನು ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.",
            "ಅವಸರದ ಅನುಭವವಾದರೆ Safety SOS ತೆರೆಯಿರಿ.",
        ],
    },
    "reasons": {
        "empty": "ಯಾವುದೇ ಮಾಹಿತಿ ಸಿಗಲಿಲ್ಲ.",
        "no_payment_info": "ಪಠ್ಯದಲ್ಲಿ ಪಾವತಿ ಮಾಹಿತಿ ಇಲ್ಲ.",
        "missing_payee": "ಪಾವತಿ ವಿಳಾಸ (UPI ಐಡಿ) ಸಿಗಲಿಲ್ಲ.",
        "invalid_payee": "ಪಾವತಿ ವಿಳಾಸ ಮಾನ್ಯವಾಗಿ ಕಾಣುತ್ತಿಲ್ಲ.",
        "unknown_bank_handle": "'@' ನಂತರದ ಬ್ಯಾಂಕ್ ಹ್ಯಾಂಡಲ್ ಭಾರತದ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಅಥವಾ UPI ಪೂರೈಕೆದಾರರಿಗೆ ಸೇರಿಲ್ಲ.",
        "unsupported_link": "ಸುರಕ್ಷತಾ ಪರಿಶೀಲನೆಗೆ ಜಾಲತಾಣ ಕೊಂಡಿಗಳು ಬೆಂಬಲಿತವಾಗಿಲ್ಲ.",
    },
    "disclaimer": (
        "ಇದು ಮಾರ್ಗದರ್ಶನ ಉಪಕರಣ. ಪಡೆಯುವವರು ನಿಜವಾಗಿದ್ದಾರೆಯೇ ಎಂದು ನಾವು "
        "ದೃಢೀಕರಿಸಲಾಗುವುದಿಲ್ಲ, ಮತ್ತು ಯಾವುದೇ ಫಲಿತಾಂಶ ಪಾವತಿಯ ಸುರಕ್ಷತೆಗೆ ಖಾತರಿ ನೀಡುವುದಿಲ್ಲ."
    ),
}

STRINGS: dict[str, dict[str, Any]] = {"en": _EN, "hi": _HI, "kn": _KN}

SUPPORTED_LANGUAGES = ("en", "hi", "kn")


def get_strings(language: str) -> dict[str, Any]:
    """Return the string table for a language, falling back to English."""
    if language in STRINGS:
        return STRINGS[language]
    return STRINGS["en"]
