import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Flame,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, ProgressBar } from "../components/bits";
import { ThreeSafetyShield } from "../components/ThreeSafetyShield";
import { useApp, useNav } from "../state";
import { tr } from "../lib/localize";

interface ThreatWave {
  id: string;
  type: "scam" | "legit";
  category: Record<string, string>;
  title: Record<string, string>;
  incomingText: Record<string, string>;
  meshColor: number;
  glowColor: number;
  shape: "cube" | "pyramid" | "sphere" | "octahedron";
  explanation: Record<string, string>;
  goldenRule: Record<string, string>;
}

const DEFENDER_WAVES: ThreatWave[] = [
  {
    id: "qr_cashback",
    type: "scam",
    category: { en: "Cashback Trap", hi: "कैशबैक जाल", kn: "ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಮೋಸ" },
    title: {
      en: "₹5,000 Festive Reward QR",
      hi: "₹5,000 त्योहारी इनाम QR",
      kn: "₹5,000 ಹಬ್ಬದ ಬಹುಮಾನ QR",
    },
    incomingText: {
      en: "Scan this QR code and enter your UPI PIN right now to receive ₹5,000 cashback into your account!",
      hi: "खाते में ₹5,000 पाने के लिए तुरंत यह QR कोड स्कैन करें और अपना UPI पिन डालें!",
      kn: "ನಿಮ್ಮ ಖಾತೆಗೆ ₹5,000 ಪಡೆಯಲು ತಕ್ಷಣ ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ UPI ಪಿನ್ ಹಾಕಿ!",
    },
    meshColor: 0xef4444,
    glowColor: 0xf87171,
    shape: "cube",
    explanation: {
      en: "Scanning a QR code and entering your UPI PIN always DEDUCTS money from your bank.",
      hi: "QR कोड स्कैन करके UPI पिन डालने से बैंक से पैसे कटते हैं, कभी मिलते नहीं।",
      kn: "QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ UPI ಪಿನ್ ನಮೂದಿಸಿದರೆ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗುತ್ತದೆ.",
    },
    goldenRule: {
      en: "Never enter your PIN to receive money.",
      hi: "पैसे पाने के लिए कभी UPI पिन न डालें।",
      kn: "ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಿನ್ ಹಾಕಬೇಡಿ.",
    },
  },
  {
    id: "urgent_electricity",
    type: "scam",
    category: { en: "Urgency Extortion", hi: "बिजली कटने की धमकी", kn: "ವಿದ್ಯುತ್ ಕಡಿತ ಬೆದರಿಕೆ" },
    title: {
      en: "Power Cut in 30 Mins",
      hi: "30 मिनट में बिजली कट जाएगी",
      kn: "30 ನಿಮಿಷದಲ್ಲಿ ಕರೆಂಟ್ ಕಟ್",
    },
    incomingText: {
      en: "URGENT: Your electricity power bill is unpaid. Power will disconnect tonight at 9:30 PM. Call this number or share OTP immediately!",
      hi: "अति आवश्यक: आपका बिजली बिल बकाया है। आज रात 9:30 बजे बिजली कट जाएगी। तुरंत इस नंबर पर कॉल करें या OTP साझा करें!",
      kn: "ತುರ್ತು: ನಿಮ್ಮ ವಿದ್ಯುತ್ ಬಿಲ್ ಬಾಕಿ ಇದೆ. ಇಂದೇ ರಾತ್ರಿ ವಿದ್ಯುತ್ ಸ್ಥಗಿತಗೊಳ್ಳುತ್ತದೆ. ತಕ್ಷಣ ಒಟಿಪಿ ನೀಡಿ!",
    },
    meshColor: 0xa855f7,
    glowColor: 0xc084fc,
    shape: "pyramid",
    explanation: {
      en: "Electricity boards never send disconnection threats over personal mobile numbers asking for OTPs.",
      hi: "बिजली बोर्ड कभी भी व्यक्तिगत फोन से OTP मांगकर बिजली काटने की धमकी नहीं देता।",
      kn: "ವಿದ್ಯುತ್ ಇಲಾಖೆಯವರು ಎಂದಿಗೂ ಮೊಬೈಲ್ ಮೂಲಕ ಒಟಿಪಿ ಕೇಳುವುದಿಲ್ಲ.",
    },
    goldenRule: {
      en: "Verify utility bills directly on official government apps.",
      hi: "बिजली बिल की पुष्टि सीधे आधिकारिक ऐप या कार्यालय से करें।",
      kn: "ಬಿಲ್ ವಿವರಗಳನ್ನು ನೇರವಾಗಿ ಅಧಿಕೃತ ಆ್ಯಪ್ ಮೂಲಕ ಪರಿಶೀಲಿಸಿ.",
    },
  },
  {
    id: "grocery_kirana",
    type: "legit",
    category: { en: "Legitimate Payment", hi: "असली दुकान भुगतान", kn: "ನೈಜ ಅಂಗಡಿ ಪಾವತಿ" },
    title: {
      en: "Sharma Kirana Store (₹120)",
      hi: "शर्मा किराना स्टोर (₹120)",
      kn: "ಶರ್ಮಾ ಕಿರಾಣಾ ಸ್ಟೋರ್ (₹120)",
    },
    incomingText: {
      en: "You bought vegetables & milk for ₹120. You scanned the shop's counter QR to PAY ₹120.",
      hi: "आपने ₹120 का दूध और सब्जियां खरीदीं। ₹120 भुगतान करने के लिए काउंटर QR स्कैन किया।",
      kn: "ನೀವು ₹120 ಸಾಮಗ್ರಿ ಖರೀದಿಸಿದ್ದೀರಿ. ಹಣ ಪಾವತಿಸಲು ಅಂಗಡಿ ಕೌಂಟರ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ್ದೀರಿ.",
    },
    meshColor: 0x10b981,
    glowColor: 0x34d399,
    shape: "sphere",
    explanation: {
      en: "Safe transaction! The payee name matches the shop and you are intentionally SENDING the exact expected amount.",
      hi: "सुरक्षित लेन-देन! नाम दुकान से मेल खाता है और आप अपनी मर्जी से तय राशि भेज रहे हैं।",
      kn: "ಸುರಕ್ಷಿತ ವಹಿವಾಟು! ಅಂಗಡಿಯ ಹೆಸರು ಸರಿಹೊಂದುತ್ತದೆ ಮತ್ತು ನೀವೇ ಪಾವತಿಸುತ್ತಿದ್ದೀರಿ.",
    },
    goldenRule: {
      en: "Check payee name and amount on the screen before entering your PIN.",
      hi: "पिन डालने से पहले स्क्रीन पर नाम और राशि अवश्य जांचें।",
      kn: "ಪಿನ್ ಹಾಕುವ ಮುನ್ನ ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    },
  },
  {
    id: "fake_apk_link",
    type: "scam",
    category: { en: "Malicious APK", hi: "खतरनाक ऐप लिंक", kn: "ಅಪಾಯಕಾರಿ ಆ್ಯಪ್ ಲಿಂಕ್" },
    title: {
      en: "Bank Security Update .apk",
      hi: "बैंक सुरक्षा अपडेट APK",
      kn: "ಬ್ಯಾಂಕ್ ಅಪ್‌ಡೇಟ್ APK",
    },
    incomingText: {
      en: "Dear customer, your bank app has expired. Click this WhatsApp link to download FastSupport.apk to reactivate your account.",
      hi: "प्रिय ग्राहक, आपका बैंक ऐप समाप्त हो गया है। चालू रखने के लिए इस लिंक से FastSupport.apk डाउनलोड करें।",
      kn: "ಗ್ರಾಹಕರೇ, ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ಮುಕ್ತಾಯವಾಗಿದೆ. ಈ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ APK ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
    },
    meshColor: 0xf59e0b,
    glowColor: 0xfbbf24,
    shape: "octahedron",
    explanation: {
      en: "Never install APK files sent via SMS or WhatsApp! They take over your phone and steal bank passwords.",
      hi: "WhatsApp या SMS पर आई APK फाइल कभी इंस्टॉल न करें! यह फोन का नियंत्रण चुरा लेती हैं।",
      kn: "SMS ಅಥವಾ WhatsApp ಮೂಲಕ ಬಂದ APK ಫೈಲ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಬೇಡಿ! ಇದು ಫೋನ್ ಹ್ಯಾಕ್ ಮಾಡುತ್ತದೆ.",
    },
    goldenRule: {
      en: "Only download bank apps from Google Play Store.",
      hi: "बैंक ऐप केवल Google Play Store से ही डाउनलोड करें।",
      kn: "ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ಗಳನ್ನು ಗೂಗಲ್ ಪ್ಲೇ ಸ್ಟೋರ್‌ನಿಂದ ಮಾತ್ರ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.",
    },
  },
  {
    id: "gpay_shoaib_demo",
    type: "legit",
    category: { en: "Verified Google Pay QR", hi: "सत्यापित गूगल पे QR", kn: "ಪರಿಶೀಲಿಸಿದ ಗೂಗಲ್ ಪೇ QR" },
    title: {
      en: "Payee: Meer Mohammed Shoaib",
      hi: "प्राप्तकर्ता: मीर मोहम्मद शोएब",
      kn: "ಸ್ವೀಕರಿಸುವವರು: ಮೀರ್ ಮೊಹಮ್ಮದ್ ಶೋಯೆಬ್",
    },
    incomingText: {
      en: "Payment QR code: upi://pay?pa=meermohammedshoaib@okicici. You want to pay for a personal transaction.",
      hi: "भुगतान QR कोड: upi://pay?pa=meermohammedshoaib@okicici. आप निजी लेन-देन के लिए भुगतान कर रहे हैं।",
      kn: "ಪಾವತಿ QR ಕೋಡ್: upi://pay?pa=meermohammedshoaib@okicici. ನೀವು ವೈಯಕ್ತಿಕ ಹಣ ಕಳುಹಿಸುತ್ತಿದ್ದೀರಿ.",
    },
    meshColor: 0x06b6d4,
    glowColor: 0x38bdf8,
    shape: "sphere",
    explanation: {
      en: "Valid clean UPI QR! When you intend to send money, Saarthi confirms there are no hidden secret requests.",
      hi: "वैध स्वच्छ UPI QR! पैसे भेजने की स्थिति में सार्थी पुष्टि करता है कि कोई छिपे खतरे नहीं हैं।",
      kn: "ವ್ಯಾಲಿಡ್ UPI QR! ಹಣ ಕಳುಹಿಸಲು ಯಾವುದೇ ಗುಪ್ತ ಅಪಾಯಗಳಿಲ್ಲ ಎಂದು ಸಾರಥಿ ದೃಢಪಡಿಸುತ್ತದೆ.",
    },
    goldenRule: {
      en: "When sending money, confirm the verified name matches the person.",
      hi: "पैसे भेजते समय जांच लें कि नाम उसी व्यक्ति का है।",
      kn: "ಹಣ ಕಳುಹಿಸುವಾಗ ಸ್ವೀಕರಿಸುವವರ ಹೆಸರು ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಗಮನಿಸಿ.",
    },
  },
];

export function DefenderScreen() {
  const { uiLang, speakIfOn } = useApp();
  const { go } = useNav();

  const [waveIndex, setWaveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [vaultHealth, setVaultHealth] = useState(100);
  const [gameStatus, setGameStatus] = useState<"playing" | "feedback" | "victory" | "gameover">("playing");
  const [lastActionCorrect, setLastActionCorrect] = useState<boolean | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const threatMeshRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const currentWave = DEFENDER_WAVES[waveIndex];

  // Initialize Three.js 3D Cyber Battleground
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = 240;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // Glowing Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(10, 16, 0x0f766e, 0x1e293b);
    gridHelper.position.y = -1.8;
    gridHelper.rotation.x = 0.2;
    scene.add(gridHelper);

    // Particle Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 12;
      starPos[i + 1] = (Math.random() - 0.5) * 8;
      starPos[i + 2] = (Math.random() - 0.5) * 6;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 3D Threat Mesh
    let geo: THREE.BufferGeometry;
    if (currentWave.shape === "cube") {
      geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    } else if (currentWave.shape === "pyramid") {
      geo = new THREE.ConeGeometry(1.4, 2, 4);
    } else if (currentWave.shape === "octahedron") {
      geo = new THREE.OctahedronGeometry(1.5, 0);
    } else {
      geo = new THREE.SphereGeometry(1.3, 32, 32);
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: currentWave.meshColor,
      emissive: currentWave.glowColor,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 0.7,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    threatMeshRef.current = mesh;

    // Outer wireframe cage
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: currentWave.glowColor,
      transparent: true,
      opacity: 0.5,
    });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireLine);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (mesh) {
        mesh.rotation.x = elapsed * 1.1;
        mesh.rotation.y = elapsed * 1.4;
        mesh.position.y = Math.sin(elapsed * 2.5) * 0.15;
      }
      gridHelper.position.z = (elapsed * 0.5) % 1;
      starField.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW } = entry.contentRect;
        if (newW > 0) {
          camera.aspect = newW / height;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      geo.dispose();
      mat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, [currentWave]);

  // Handle Player Defensive Move
  const handleDecision = (action: "deflect_scam" | "accept_legit") => {
    if (gameStatus !== "playing") return;

    const isScam = currentWave.type === "scam";
    const correct =
      (action === "deflect_scam" && isScam) ||
      (action === "accept_legit" && !isScam);

    setLastActionCorrect(correct);

    if (correct) {
      const streakBonus = (streak + 1) * 50;
      setScore((s) => s + 100 + streakBonus);
      setStreak((st) => st + 1);

      // Celebrate with sparks
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#2dd4bf", "#f59e0b", "#10b981"],
      });

      speakIfOn(
        uiLang === "hi"
          ? "बहुत बढ़िया! सही निर्णय।"
          : "Blocked! Safe decision.",
      );
    } else {
      setStreak(0);
      setVaultHealth((h) => Math.max(0, h - 25));

      speakIfOn(
        uiLang === "hi"
          ? "सावधान! यह एक धोखा था।"
          : "Warning! That was a trap.",
      );
    }

    setGameStatus("feedback");
  };

  const handleNextWave = () => {
    if (vaultHealth <= 0) {
      setGameStatus("gameover");
      return;
    }

    if (waveIndex + 1 >= DEFENDER_WAVES.length) {
      setGameStatus("victory");
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
      return;
    }

    setWaveIndex((w) => w + 1);
    setGameStatus("playing");
  };

  const restartGame = () => {
    setWaveIndex(0);
    setScore(0);
    setStreak(0);
    setVaultHealth(100);
    setGameStatus("playing");
    setLastActionCorrect(null);
  };

  // Victory Screen
  if (gameStatus === "victory") {
    return (
      <div className="space-y-6">
        <Card className="flex flex-col items-center text-center p-8">
          <ThreeSafetyShield className="w-full h-56" celebrate={true} tone="safe" />
          <h1 className="mt-4 text-3xl font-extrabold text-navy">
            {uiLang === "hi"
              ? "🏆 बधाई! आप बने डिजिटल सुरक्षा चैंपियन!"
              : uiLang === "kn"
                ? "🏆 ಅಭಿನಂದನೆಗಳು! ಡಿಜಿಟಲ್ ಭದ್ರತಾ ಚಾಂಪಿಯನ್!"
                : "🏆 Cyber Defense Master!"}
          </h1>
          <p className="mt-2 text-xl font-bold text-teal-dark">
            {uiLang === "hi"
              ? `कुल स्कोर: ${score} अंक | 100% सुरक्षा सफलता`
              : `Total Score: ${score} pts | All Threat Waves Neutralized`}
          </p>
          <p className="mt-2 text-base text-navy/80 max-w-lg">
            {uiLang === "hi"
              ? "आपने QR कैशबैक जाल, बिजली बिल धमकी और फेक APK डाउनलोड को सफलतापूर्वक पहचानकर अपने बैंक खाते की रक्षा की!"
              : "You successfully deflected scam QR codes, urgent bill-cut traps, and fake APKs while safely verifying legitimate merchant transactions."}
          </p>

          <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <BigButton full variant="teal" onClick={restartGame} icon={<RotateCcw className="h-6 w-6" />}>
              {uiLang === "hi" ? "फिर से खेलें" : "Play Again"}
            </BigButton>
            <BigButton full variant="navy" onClick={() => go({ screen: "learn" })} icon={<ArrowLeft className="h-6 w-6" />}>
              {uiLang === "hi" ? "सीखने के केंद्र में लौटें" : "Back to Learn"}
            </BigButton>
          </div>
        </Card>
      </div>
    );
  }

  // Game Over Screen
  if (gameStatus === "gameover") {
    return (
      <div className="space-y-6">
        <Card className="flex flex-col items-center text-center p-8">
          <ThreeSafetyShield className="w-full h-56" celebrate={false} tone="danger" />
          <h1 className="mt-4 text-3xl font-extrabold text-coral-dark">
            {uiLang === "hi" ? "सुरक्षा ढाल टूट गई!" : "Vault Security Breached!"}
          </h1>
          <p className="mt-2 text-lg text-navy/80">
            {uiLang === "hi"
              ? "धोखेबाजों ने आपकी सुरक्षा को चकमा दिया। कोई बात नहीं, अभ्यास से आप और मजबूत बनेंगे!"
              : "A scam trap slipped past your shield. Remember: You never enter your UPI PIN to receive money!"}
          </p>
          <div className="mt-6 w-full max-w-md">
            <BigButton full variant="coral" onClick={restartGame} icon={<RotateCcw className="h-6 w-6" />}>
              {uiLang === "hi" ? "दोबारा कोशिश करें" : "Retry Defense"}
            </BigButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with Stats */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => go({ screen: "learn" })}
            className="flex items-center gap-1.5 text-sm font-bold text-navy/70 hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{uiLang === "hi" ? "वापस जाएं" : "Back to Learn"}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
            {uiLang === "hi" ? "🛡️ सेफपे 3D डिफेंडर" : "🛡️ SafePay 3D Defender"}
          </h1>
        </div>

        {/* Live Score & Streak */}
        <div className="flex items-center gap-4 rounded-2xl bg-paper border border-navy/15 px-4 py-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-navy">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-extrabold text-lg">{score}</span>
          </div>
          {streak > 1 ? (
            <div className="flex items-center gap-1 text-coral font-extrabold text-sm animate-bounce">
              <Flame className="h-4 w-4" />
              <span>{streak}x Combo</span>
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <Shield className={`h-5 w-5 ${vaultHealth > 50 ? "text-teal" : "text-coral"}`} />
            <span className="font-bold text-sm">{vaultHealth}%</span>
          </div>
        </div>
      </header>

      {/* Wave Progress Bar */}
      <div>
        <ProgressBar
          value={(waveIndex + 1) / DEFENDER_WAVES.length}
          label={`Wave ${waveIndex + 1} of ${DEFENDER_WAVES.length}`}
        />
        <div className="mt-1 flex justify-between text-xs font-bold text-navy/70">
          <span>{uiLang === "hi" ? `खतरा लहर ${waveIndex + 1}/${DEFENDER_WAVES.length}` : `Threat Wave ${waveIndex + 1}/${DEFENDER_WAVES.length}`}</span>
          <span className="uppercase tracking-wider">{tr(currentWave.category, uiLang)}</span>
        </div>
      </div>

      {/* Interactive 3D Arena */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-navy/5 via-navy/10 to-navy/5 p-4">
        <div
          ref={canvasContainerRef}
          className="h-[240px] w-full cursor-grab active:cursor-grabbing rounded-xl"
          role="img"
          aria-label="3D Threat Simulation Arena"
        />

        {/* Incoming Threat Description Overlay */}
        <div className="mt-3 rounded-2xl border-2 border-navy/15 bg-paper p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 px-3 py-0.5 text-xs font-extrabold text-navy">
              {currentWave.shape.toUpperCase()} THREAT VECTOR
            </span>
            <span className="text-sm font-extrabold text-navy/80">{tr(currentWave.title, uiLang)}</span>
          </div>
          <p className="mt-2 text-lg font-bold leading-relaxed text-navy">
            "{tr(currentWave.incomingText, uiLang)}"
          </p>
        </div>
      </Card>

      {/* Decision Buttons (Playing Mode) */}
      {gameStatus === "playing" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <BigButton
            full
            variant="coral"
            onClick={() => handleDecision("deflect_scam")}
            icon={<ShieldAlert className="h-6 w-6" />}
          >
            {uiLang === "hi" ? "⛔ धोखा रोकें! (DEFLECT SCAM)" : "⛔ Block & Deflect Scam"}
          </BigButton>
          <BigButton
            full
            variant="teal"
            onClick={() => handleDecision("accept_legit")}
            icon={<ShieldCheck className="h-6 w-6" />}
          >
            {uiLang === "hi" ? "✅ सुरक्षित भुगतान करें (SAFE PAY)" : "✅ Safe Intended Payment"}
          </BigButton>
        </div>
      ) : null}

      {/* Feedback Overlay */}
      {gameStatus === "feedback" ? (
        <div className="space-y-4">
          <Banner
            tone={lastActionCorrect ? "success" : "danger"}
            title={
              lastActionCorrect
                ? uiLang === "hi"
                  ? "शाबाश! बिल्कुल सही रक्षा!"
                  : "Shield Deflection Successful!"
                : uiLang === "hi"
                  ? "सावधान! गलत निर्णय!"
                  : "Security Breach Warning!"
            }
          >
            <p className="text-base font-bold">{tr(currentWave.explanation, uiLang)}</p>
          </Banner>

          <Card className="border-l-4 border-l-teal">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-teal-dark">
              {uiLang === "hi" ? "स्वर्ण नियम (Golden Rule)" : "Golden Rule"}
            </h3>
            <p className="mt-1 text-lg font-extrabold text-navy">
              {tr(currentWave.goldenRule, uiLang)}
            </p>
          </Card>

          <BigButton full variant="navy" onClick={handleNextWave} icon={<Sparkles className="h-6 w-6" />}>
            {waveIndex + 1 >= DEFENDER_WAVES.length
              ? uiLang === "hi"
                ? "परिणाम और ट्रॉफी देखें"
                : "View Final Results & Trophy"
              : uiLang === "hi"
                ? "अगला खतरा लहर (Next Wave)"
                : "Defend Next Wave"}
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}
