/**
 * Hand-drawn flat illustrations for Saarthi and every content scene.
 * All artwork uses the app palette so cards stay visually consistent.
 */

import type { ReactNode } from "react";

const NAVY = "#17324D";
const TEAL = "#0F9D8A";
const SUN = "#FFC857";
const CREAM = "#FFF8E8";
const CORAL = "#E85D5D";
const WHITE = "#FFFFFF";

/* ------------------------------------------------------------------ */
/* Mascot                                                              */
/* ------------------------------------------------------------------ */

export type MascotMood = "happy" | "alert" | "thinking";

export function SaarthiMascot({
  mood = "happy",
  className = "",
}: {
  mood?: MascotMood;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Saarthi, the helpful guide"
    >
      {/* guiding star */}
      <path
        d="M60 4 L65 18 L60 14.5 L55 18 Z"
        fill={SUN}
        stroke={NAVY}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="64" r="42" fill={TEAL} />
      <circle cx="60" cy="64" r="33" fill={CREAM} />
      {/* cheeks */}
      <circle cx="41" cy="71" r="5" fill={CORAL} opacity="0.5" />
      <circle cx="79" cy="71" r="5" fill={CORAL} opacity="0.5" />
      {/* eyes */}
      <circle cx="50" cy="58" r="4.5" fill={NAVY} />
      <circle cx="70" cy="58" r="4.5" fill={NAVY} />
      {mood === "alert" ? (
        <>
          <path d="M43 49 L55 53" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
          <path d="M77 49 L65 53" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="60" cy="78" rx="6" ry="7" fill={NAVY} />
        </>
      ) : null}
      {mood === "thinking" ? (
        <>
          <path d="M44 51 L55 48" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
          <path d="M76 51 L65 48" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
          <path d="M49 78 Q60 72 71 78" stroke={NAVY} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {mood === "happy" ? (
        <path d="M47 74 Q60 86 73 74" stroke={NAVY} strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scene artwork                                                       */
/* ------------------------------------------------------------------ */

export type SceneKind =
  | "shop"
  | "amount"
  | "message"
  | "receive"
  | "link"
  | "novpa"
  | "otp"
  | "pin"
  | "threat"
  | "qr"
  | "question"
  | "thinking"
  | "check"
  | "gone"
  | "safe";

function QrGlyph({ x, y, s }: { x: number; y: number; s: number }) {
  const u = s / 7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={s} height={s} rx={u} fill={WHITE} stroke={NAVY} strokeWidth="2.5" />
      <rect x={u} y={u} width={u * 2} height={u * 2} fill={NAVY} />
      <rect x={u * 4.5} y={u} width={u * 2} height={u * 2} fill={NAVY} />
      <rect x={u} y={u * 4.5} width={u * 2} height={u * 2} fill={NAVY} />
      <rect x={u * 4.8} y={u * 4.8} width={u * 1.4} height={u * 1.4} fill={TEAL} />
      <rect x={u * 3} y={u * 3.2} width={u} height={u} fill={TEAL} />
    </g>
  );
}

function PhoneGlyph({
  x,
  y,
  w = 44,
  h = 72,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="9" fill={NAVY} />
      <rect x="4" y="7" width={w - 8} height={h - 18} rx="4" fill={CREAM} />
      <circle cx={w / 2} cy={h - 5.5} r="2.6" fill={CREAM} />
      {children}
    </g>
  );
}

function ShieldGlyph({
  x,
  y,
  s = 1,
  fill = TEAL,
  check = true,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
  check?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M32 2 L58 12 V32 C58 48 46 58 32 62 C18 58 6 48 6 32 V12 Z"
        fill={fill}
        stroke={NAVY}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {check ? (
        <path
          d="M20 32 L29 41 L45 24"
          stroke={WHITE}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
}

function LockGlyph({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M18 30 V20 A14 14 0 0 1 46 20 V30"
        fill="none"
        stroke={NAVY}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="10" y="30" width="44" height="34" rx="8" fill={SUN} stroke={NAVY} strokeWidth="3" />
      <circle cx="32" cy="44" r="4.5" fill={NAVY} />
      <rect x="30" y="46" width="4" height="10" rx="2" fill={NAVY} />
    </g>
  );
}

function Bubble({
  x,
  y,
  w = 96,
  h = 62,
  fill = WHITE,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill?: string;
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="14" fill={fill} stroke={NAVY} strokeWidth="3" />
      <path d={`M18 ${h} L14 ${h + 14} L38 ${h} Z`} fill={fill} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      {children}
    </g>
  );
}

function RupeeCircle({ x, y, r = 28, fill = TEAL }: { x: number; y: number; r?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} stroke={NAVY} strokeWidth="3" />
      <text
        x="0"
        y={r * 0.36}
        textAnchor="middle"
        fontSize={r * 1.05}
        fontWeight="800"
        fill={fill === SUN ? NAVY : WHITE}
      >
        ₹
      </text>
    </g>
  );
}

function AlertTriangle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M28 2 L54 48 H2 Z" fill={SUN} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      <rect x="25" y="16" width="6" height="17" rx="3" fill={NAVY} />
      <circle cx="28" cy="40" r="3.4" fill={NAVY} />
    </g>
  );
}

function PersonGlyph({
  x,
  y,
  s = 1,
  hair = NAVY,
}: {
  x: number;
  y: number;
  s?: number;
  hair?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 66 C0 44 12 34 26 34 C40 34 52 44 52 66 Z" fill={TEAL} stroke={NAVY} strokeWidth="3" />
      <circle cx="26" cy="16" r="15" fill={CREAM} stroke={NAVY} strokeWidth="3" />
      <path d="M11 13 A15 15 0 0 1 41 13 L41 8 A15 15 0 0 0 11 8 Z" fill={hair} />
      <path d="M11 12 C13 2 39 2 41 12 L41 6 C38 -2 14 -2 11 6 Z" fill={hair} />
      <circle cx="20" cy="17" r="2.4" fill={NAVY} />
      <circle cx="32" cy="17" r="2.4" fill={NAVY} />
      <path d="M20 24 Q26 29 32 24" stroke={NAVY} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

const SCENE_BG = (
  <>
    <rect x="4" y="4" width="232" height="142" rx="24" fill={CREAM} />
    <rect x="4" y="4" width="232" height="142" rx="24" fill={NAVY} fillOpacity="0.04" />
  </>
);

/* ------------------------------------------------------------------ */

function SceneBody({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "qr":
      return (
        <>
          <PersonGlyph x={26} y={40} s={0.9} />
          <PhoneGlyph x={86} y={48} w={38} h={60}>
            <rect x="10" y="16" width="18" height="18" fill={TEAL} opacity="0.5" />
          </PhoneGlyph>
          <QrGlyph x={150} y={46} s={62} />
          <path d="M132 60 Q142 76 132 92" stroke={TEAL} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="6 9" />
        </>
      );
    case "shop":
      return (
        <>
          <path d="M120 30 L142 14 H226 L204 30 Z" fill={SUN} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
          <path d="M120 30 A10 10 0 0 0 140 30 A10 10 0 0 0 160 30 A10 10 0 0 0 180 30 A10 10 0 0 0 200 30 A10 10 0 0 0 220 30" fill={CORAL} stroke={NAVY} strokeWidth="3" />
          <rect x="128" y="34" width="88" height="94" rx="8" fill={WHITE} stroke={NAVY} strokeWidth="3" />
          <QrGlyph x={144} y={46} s={56} />
          <PersonGlyph x={24} y={46} s={0.95} />
          <PhoneGlyph x={84} y={58} w={34} h={54} />
        </>
      );
    case "amount":
      return (
        <>
          <RupeeCircle x={84} y={74} r={38} fill={TEAL} />
          <RupeeCircle x={168} y={86} r={26} fill={WHITE} />
          <text x="168" y="96" textAnchor="middle" fontSize="26" fontWeight="800" fill={NAVY}>
            ?
          </text>
          <AlertTriangle x={158} y={20} s={0.9} />
        </>
      );
    case "message":
      return (
        <>
          <Bubble x={54} y={26} w={132} h={80} fill={WHITE}>
            <path d="M18 18 L66 52 L114 18" stroke={NAVY} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Bubble>
          <AlertTriangle x={168} y={70} s={0.85} />
        </>
      );
    case "receive":
      return (
        <>
          <rect x="72" y="58" width="96" height="60" rx="8" fill={SUN} stroke={NAVY} strokeWidth="3" />
          <rect x="72" y="46" width="96" height="22" rx="6" fill={CORAL} stroke={NAVY} strokeWidth="3" />
          <rect x="112" y="46" width="16" height="72" fill={TEAL} stroke={NAVY} strokeWidth="3" />
          <path d="M120 46 C104 30 92 44 120 46 C148 44 136 30 120 46 Z" fill={TEAL} stroke={NAVY} strokeWidth="3" />
          <path d="M198 44 V86 M198 86 L186 74 M198 86 L210 74" stroke={NAVY} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 44 V86 M42 86 L30 74 M42 86 L54 74" stroke={CORAL} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "link":
      return (
        <>
          <rect x="34" y="62" width="82" height="34" rx="17" fill={WHITE} stroke={NAVY} strokeWidth="4" />
          <rect x="124" y="62" width="82" height="34" rx="17" fill={TEAL} stroke={NAVY} strokeWidth="4" />
          <path d="M96 79 H144" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
          <text x="120" y="36" textAnchor="middle" fontSize="28" fontWeight="800" fill={NAVY}>
            ?
          </text>
          <AlertTriangle x={176} y={24} s={0.7} />
        </>
      );
    case "novpa":
      return (
        <>
          <QrGlyph x={52} y={34} s={82} />
          <text x="172" y="92" textAnchor="middle" fontSize="46" fontWeight="800" fill={NAVY}>
            ?
          </text>
          <text x="164" y="128" textAnchor="middle" fontSize="30" fontWeight="800" fill={CORAL}>
            ₹
          </text>
        </>
      );
    case "otp":
      return (
        <>
          <PhoneGlyph x={34} y={30} w={72} h={104}>
            <rect x="10" y="18" width="52" height="26" rx="8" fill={WHITE} stroke={NAVY} strokeWidth="2.5" />
            <text x="36" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill={CORAL}>
              OTP
            </text>
            <rect x="10" y="52" width="42" height="8" rx="4" fill={NAVY} opacity="0.25" />
            <rect x="10" y="66" width="52" height="8" rx="4" fill={NAVY} opacity="0.25" />
          </PhoneGlyph>
          <AlertTriangle x={152} y={46} s={1.05} />
        </>
      );
    case "pin":
      return (
        <>
          <LockGlyph x={66} y={26} s={1.25} />
          <circle cx="186" cy="60" r="20" fill={CORAL} stroke={NAVY} strokeWidth="3" />
          <text x="186" y="68" textAnchor="middle" fontSize="24" fontWeight="800" fill={WHITE}>
            !
          </text>
          <circle cx="150" cy="106" r="16" fill={WHITE} stroke={NAVY} strokeWidth="3" />
          <text x="150" y="113" textAnchor="middle" fontSize="20" fontWeight="800" fill={NAVY}>
            ?
          </text>
        </>
      );
    case "threat":
      return (
        <>
          <path d="M40 60 L112 34 V110 L40 84 Z" fill={SUN} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
          <rect x="22" y="58" width="22" height="28" rx="6" fill={TEAL} stroke={NAVY} strokeWidth="3" />
          <path d="M62 84 L74 122" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
          <path d="M136 46 Q152 72 136 98" stroke={CORAL} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M164 34 Q188 72 164 110" stroke={CORAL} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="2 14" />
        </>
      );
    case "question":
      return (
        <>
          <circle cx="120" cy="74" r="52" fill={SUN} stroke={NAVY} strokeWidth="3.5" />
          <text x="120" y="94" textAnchor="middle" fontSize="64" fontWeight="800" fill={NAVY}>
            ?
          </text>
          <circle cx="196" cy="34" r="10" fill={TEAL} />
          <circle cx="42" cy="116" r="8" fill={CORAL} />
        </>
      );
    case "thinking":
      return (
        <>
          <PersonGlyph x={30} y={46} s={1.05} hair="#8A93A0" />
          <Bubble x={120} y={26} w={80} h={54} fill={WHITE}>
            <text x="40" y="40" textAnchor="middle" fontSize="34" fontWeight="800" fill={NAVY}>
              ?
            </text>
          </Bubble>
          <circle cx="126" cy="96" r="8" fill={WHITE} stroke={NAVY} strokeWidth="3" />
          <circle cx="142" cy="112" r="5" fill={WHITE} stroke={NAVY} strokeWidth="3" />
        </>
      );
    case "check":
      return (
        <>
          <PhoneGlyph x={30} y={28} w={76} h={108}>
            <rect x="12" y="16" width="52" height="10" rx="5" fill={NAVY} opacity="0.25" />
            <rect x="12" y="32" width="40" height="10" rx="5" fill={NAVY} opacity="0.25" />
            <rect x="12" y="52" width="52" height="22" rx="8" fill={TEAL} />
          </PhoneGlyph>
          <ShieldGlyph x={128} y={34} s={1.35} />
        </>
      );
    case "gone":
      return (
        <>
          <RupeeCircle x={84} y={76} r={36} fill={WHITE} />
          <path d="M136 76 H204" stroke={CORAL} strokeWidth="6" strokeLinecap="round" />
          <path d="M204 76 L186 62 M204 76 L186 90" stroke={CORAL} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 24 H166" stroke={NAVY} strokeWidth="4" strokeLinecap="round" strokeDasharray="4 10" />
        </>
      );
    case "safe":
      return (
        <>
          <ShieldGlyph x={34} y={26} s={1.3} />
          <PersonGlyph x={140} y={44} s={0.85} />
          <PersonGlyph x={176} y={52} s={0.7} hair="#8A93A0" />
          <circle cx="210" cy="34" r="7" fill={SUN} />
        </>
      );
    default:
      return null;
  }
}

export function SceneArt({
  kind,
  className = "",
}: {
  kind: SceneKind;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden="true">
      {SCENE_BG}
      <SceneBody kind={kind} />
    </svg>
  );
}
