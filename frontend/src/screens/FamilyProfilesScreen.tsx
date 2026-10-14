import { useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card } from "../components/bits";
import {
  DEFAULT_FAMILY_MEMBERS,
  type FamilyMember,
  deleteFamilyProfile,
  getFamilyProfiles,
  saveFamilyProfile,
} from "../lib/family";
import { useApp, useNav } from "../state";

export function FamilyProfilesScreen() {
  const { lang, t } = useApp();
  const { back } = useNav();

  const [profiles, setProfiles] = useState<FamilyMember[]>(() => getFamilyProfiles());
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Son");
  const [vpa, setVpa] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const relationships = [
    { label: lang === "hi" ? "बेटा" : lang === "kn" ? "ಮಗ" : "Son", val: "Son", key: "son" },
    { label: lang === "hi" ? "बेटी" : lang === "kn" ? "ಮಗಳು" : "Daughter", val: "Daughter", key: "daughter" },
    { label: lang === "hi" ? "जीवनसाथी" : lang === "kn" ? "ಸಂಗಾತಿ" : "Spouse", val: "Spouse", key: "spouse" },
    { label: lang === "hi" ? "केयरगिवर" : lang === "kn" ? "ಆರೈಕೆದಾರ" : "Caregiver", val: "Caregiver", key: "caregiver" },
    { label: lang === "hi" ? "दुकानदार" : lang === "kn" ? "ವಿಶ್ವಾಸಾರ್ಹ ಅಂಗಡಿ" : "Trusted Shop", val: "Trusted Shop", key: "trusted_shop" },
    { label: lang === "hi" ? "अन्य" : lang === "kn" ? "ಇತರೆ" : "Other", val: "Other", key: "other" },
  ];

  const handleAdd = () => {
    setFormError(null);
    const trimmedName = name.trim();
    const trimmedVpa = vpa.trim().toLowerCase();

    if (!trimmedName) {
      setFormError(lang === "hi" ? "कृपया नाम लिखें" : lang === "kn" ? "ದಯವಿಟ್ಟು ಹೆಸರು ನಮೂದಿಸಿ" : "Please enter a name");
      return;
    }
    if (!trimmedVpa || !trimmedVpa.includes("@")) {
      setFormError(
        lang === "hi"
          ? "कृपया मान्य UPI ID दर्ज करें (उदा. rahul@okhdfcbank)"
          : lang === "kn"
            ? "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ UPI ID ನಮೂದಿಸಿ"
            : "Please enter a valid UPI ID (e.g. rahul@okhdfcbank)",
      );
      return;
    }

    const relObj = relationships.find((r) => r.val === relationship);
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: trimmedName,
      relationship,
      relationshipKey: (relObj?.key as FamilyMember["relationshipKey"]) ?? "other",
      vpa: trimmedVpa,
      phoneNumber: phone.trim() || undefined,
    };

    saveFamilyProfile(newMember);
    setProfiles(getFamilyProfiles());
    setName("");
    setVpa("");
    setPhone("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    deleteFamilyProfile(id);
    setProfiles(getFamilyProfiles());
  };

  const handleResetDefaults = () => {
    try {
      window.localStorage.setItem("saarthi:family_profiles", JSON.stringify(DEFAULT_FAMILY_MEMBERS));
      setProfiles(DEFAULT_FAMILY_MEMBERS);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            {lang === "hi"
              ? "परिवार और भरोसेमंद संपर्क"
              : lang === "kn"
                ? "ಕುಟುಂಬ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕಗಳು"
                : "Family & Trusted Contacts"}
          </h1>
          <p className="mt-1 text-lg text-navy/80">
            {lang === "hi"
              ? "पहचान के लिए अपने परिवार और भरोसेमंद दुकानों के UPI ID जोड़ें।"
              : lang === "kn"
                ? "ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ಕುಟುಂಬದ ಸದಸ್ಯರ UPI ID ಗಳನ್ನು ಉಳಿಸಿ."
                : "Save your loved ones' UPI IDs for instant recognition during payments."}
          </p>
        </div>
        <BigButton variant="outline" onClick={back} icon={<ArrowLeft className="h-5 w-5" />}>
          {t.nav.back}
        </BigButton>
      </header>

      {/* Info banner */}
      <Banner tone="tip" icon={<ShieldCheck className="h-7 w-7" aria-hidden="true" />} title={lang === "hi" ? "सुरक्षा सहायता" : lang === "kn" ? "ಭದ್ರತೆ ಸಲಹೆ" : "Safety Protection"}>
        <p>
          {lang === "hi"
            ? "जब भी आप QR स्कैन करेंगे, SAARTHI तुरंत बताएगा कि क्या प्राप्तकर्ता आपके परिवार का सदस्य है।"
            : lang === "kn"
              ? "ನೀವು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದಾಗ ಸ್ವೀಕೃತಿದಾರರು ನಿಮ್ಮ ಕುಟುಂಬದವರೇ ಎಂದು SAARTHI ಪರಿಶೀಲಿಸುತ್ತದೆ."
              : "Whenever you scan a QR or enter a UPI ID, SAARTHI immediately highlights if it belongs to your trusted family members."}
        </p>
      </Banner>

      {/* Add contact toggle */}
      {!showAddForm ? (
        <button
          type="button"
          data-testid="add-family-btn"
          onClick={() => setShowAddForm(true)}
          className="flex min-h-[60px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-teal-dark bg-teal px-6 py-3 text-lg font-bold text-white shadow-soft hover:bg-teal-dark"
        >
          <UserPlus className="h-6 w-6" />
          <span>{lang === "hi" ? "+ नया पारिवारिक संपर्क जोड़ें" : lang === "kn" ? "+ ಹೊಸ ಸಂಪರ್ಕ ಸೇರಿಸಿ" : "+ Add New Family Contact"}</span>
        </button>
      ) : (
        <Card className="border-2 border-teal space-y-4">
          <h2 className="text-xl font-extrabold text-teal-dark">
            {lang === "hi" ? "नया पारिवारिक संपर्क जोड़ें" : lang === "kn" ? "ಹೊಸ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ" : "Add Family Contact"}
          </h2>

          <div>
            <label className="block text-sm font-bold text-navy/80">
              {lang === "hi" ? "नाम" : lang === "kn" ? "ಹೆಸರು" : "Full Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="mt-1 w-full rounded-2xl border-2 border-navy/20 bg-paper p-3.5 text-lg font-bold focus:border-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy/80">
              {lang === "hi" ? "रिश्ता" : lang === "kn" ? "ಸಂಬಂಧ" : "Relationship"}
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-navy/20 bg-paper p-3.5 text-lg font-bold focus:border-navy"
            >
              {relationships.map((rel) => (
                <option key={rel.val} value={rel.val}>
                  {rel.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy/80">
              UPI ID (VPA)
            </label>
            <input
              type="text"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="e.g. rahul@okhdfcbank"
              className="mt-1 w-full rounded-2xl border-2 border-navy/20 bg-paper p-3.5 font-mono text-lg font-bold focus:border-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy/80">
              {lang === "hi" ? "फ़ोन नंबर (व्हाट्सएप सहायता के लिए)" : lang === "kn" ? "ದೂರವಾಣಿ ಸಂಖ್ಯೆ (WhatsApp ಗಾಗಿ)" : "Phone Number (for WhatsApp help)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="mt-1 w-full rounded-2xl border-2 border-navy/20 bg-paper p-3.5 text-lg font-bold focus:border-navy"
            />
          </div>

          {formError ? (
            <Banner tone="danger" title={t.common.errorTitle}>
              {formError}
            </Banner>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              data-testid="save-family-btn"
              onClick={handleAdd}
              className="flex min-h-[60px] w-full items-center justify-center rounded-2xl border-2 border-teal-dark bg-teal px-6 py-3 text-lg font-bold text-white shadow-soft hover:bg-teal-dark"
            >
              {lang === "hi" ? "सहेजें" : lang === "kn" ? "ಉಳಿಸಿ" : "Save Contact"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex min-h-[60px] w-full items-center justify-center rounded-2xl border-2 border-navy/25 bg-paper px-6 py-3 text-lg font-bold text-navy shadow-soft hover:border-navy/50"
            >
              {t.common.cancel}
            </button>
          </div>
        </Card>
      )}

      {/* Profiles list */}
      <section aria-labelledby="family-list-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="family-list-title" className="text-xl font-extrabold text-navy">
            {lang === "hi" ? "सहेजे गए संपर्क" : lang === "kn" ? "ಉಳಿಸಿದ ಸಂಪರ್ಕಗಳು" : "Saved Contacts"} ({profiles.length})
          </h2>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-bold text-teal-dark underline hover:opacity-80"
          >
            {lang === "hi" ? "डिफ़ॉल्ट रीसेट करें" : lang === "kn" ? "ಮರುಹೊಂದಿಸಿ" : "Restore Sample Defaults"}
          </button>
        </div>

        {profiles.length === 0 ? (
          <Card>
            <p className="text-center text-lg text-navy/70 py-4">
              {lang === "hi" ? "कोई पारिवारिक संपर्क नहीं मिला।" : lang === "kn" ? "ಯಾವುದೇ ಸಂಪರ್ಕ ಕಂಡುಬಂದಿಲ್ಲ." : "No family contacts added yet."}
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <Card className="flex items-center justify-between gap-3 border-2 border-navy/10 hover:border-teal transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal text-white">
                      <ShieldCheck className="h-7 w-7" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xl font-black text-navy">{profile.name}</span>
                        <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-bold text-teal-dark shrink-0">
                          {profile.relationship}
                        </span>
                      </div>
                      <p className="font-mono text-sm font-semibold text-navy/80 truncate">
                        {profile.vpa}
                      </p>
                      {profile.phoneNumber ? (
                        <p className="text-xs text-navy/60">Phone: {profile.phoneNumber}</p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(profile.id)}
                    aria-label={`Delete ${profile.name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-navy/15 text-coral hover:bg-coral hover:text-white transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
