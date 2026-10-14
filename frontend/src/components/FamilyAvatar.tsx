
interface FamilyAvatarProps {
  role: "son" | "wife" | "grandson" | "granddaughter";
  className?: string;
  size?: number;
}

export function FamilyAvatar({ role, className = "h-20 w-20", size = 80 }: FamilyAvatarProps) {
  switch (role) {
    case "son":
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 rounded-full border-3 border-blue-500 shadow-sm ${className}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="50" fill="#DBEAFE" />
          {/* Body/Shirt */}
          <path d="M22 96 C22 75 35 68 50 68 C65 68 78 75 78 96 Z" fill="#2563EB" />
          {/* Collar */}
          <polygon points="50,78 42,68 58,68" fill="#FFFFFF" />
          {/* Neck */}
          <rect x="44" y="55" width="12" height="15" fill="#FBBF24" />
          {/* Head */}
          <ellipse cx="50" cy="42" rx="20" ry="24" fill="#FDE68A" />
          {/* Hair */}
          <path d="M28 38 C28 22 42 16 52 16 C66 16 72 24 72 35 C68 30 58 26 44 26 C36 26 30 32 28 38 Z" fill="#1E293B" />
          {/* Glasses */}
          <rect x="36" y="38" width="11" height="8" rx="2" fill="none" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="53" y="38" width="11" height="8" rx="2" fill="none" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="47" y1="42" x2="53" y2="42" stroke="#0F172A" strokeWidth="2.5" />
          {/* Smile */}
          <path d="M44 54 Q50 60 56 54" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "wife":
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 rounded-full border-3 border-rose-500 shadow-sm ${className}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="50" fill="#FFE4E6" />
          {/* Saree drape */}
          <path d="M20 96 C20 74 34 66 50 66 C66 66 80 74 80 96 Z" fill="#BE123C" />
          <path d="M30 96 C36 78 48 70 65 66" stroke="#FDE047" strokeWidth="4" fill="none" />
          {/* Neck */}
          <rect x="44" y="54" width="12" height="14" fill="#FBBF24" />
          {/* Head */}
          <ellipse cx="50" cy="42" rx="20" ry="23" fill="#FDE68A" />
          {/* Hair bun and silver-streaked hair */}
          <path d="M28 42 C26 26 38 18 50 18 C62 18 74 26 72 42 C68 28 58 24 50 24 C40 24 32 28 28 42 Z" fill="#475569" />
          {/* Red Bindi */}
          <circle cx="50" cy="36" r="2.8" fill="#DC2626" />
          {/* Eyes */}
          <ellipse cx="42" cy="42" rx="2.5" ry="2" fill="#334155" />
          <ellipse cx="58" cy="42" rx="2.5" ry="2" fill="#334155" />
          {/* Gentle Smile */}
          <path d="M43 54 Q50 61 57 54" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
          {/* Earrings */}
          <circle cx="28" cy="47" r="2.5" fill="#F59E0B" />
          <circle cx="72" cy="47" r="2.5" fill="#F59E0B" />
        </svg>
      );

    case "grandson":
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 rounded-full border-3 border-emerald-500 shadow-sm ${className}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="50" fill="#D1FAE5" />
          {/* Hoodie / Polo */}
          <path d="M22 96 C22 74 34 68 50 68 C66 68 78 74 78 96 Z" fill="#059669" />
          {/* Neck */}
          <rect x="44" y="56" width="12" height="14" fill="#FBBF24" />
          {/* Head */}
          <ellipse cx="50" cy="42" rx="19" ry="22" fill="#FDE68A" />
          {/* Modern Hair */}
          <path d="M30 36 C30 20 42 15 54 15 C66 15 70 22 70 34 C64 24 54 22 44 22 C36 22 32 28 30 36 Z" fill="#3B2F2F" />
          {/* Big friendly eyes */}
          <circle cx="43" cy="40" r="3" fill="#1E293B" />
          <circle cx="57" cy="40" r="3" fill="#1E293B" />
          {/* Cheerful grin */}
          <path d="M43 52 Q50 60 57 52" fill="#FFFFFF" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "granddaughter":
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 rounded-full border-3 border-amber-500 shadow-sm ${className}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="50" fill="#FEF3C7" />
          {/* Dress */}
          <path d="M22 96 C22 74 34 68 50 68 C66 68 78 74 78 96 Z" fill="#D97706" />
          {/* Neck */}
          <rect x="44" y="55" width="12" height="15" fill="#FBBF24" />
          {/* Head */}
          <ellipse cx="50" cy="42" rx="19" ry="22" fill="#FDE68A" />
          {/* Long Hair / Ponytail */}
          <path d="M26 38 C26 22 38 16 50 16 C62 16 74 22 74 38 C76 52 74 66 70 72 C68 62 66 45 66 35 C58 26 42 26 34 35 C34 45 32 62 30 72 C26 66 24 52 26 38 Z" fill="#292524" />
          {/* Hair clip */}
          <circle cx="34" cy="28" r="3" fill="#EC4899" />
          {/* Sparkly eyes */}
          <circle cx="43" cy="41" r="2.8" fill="#1C1917" />
          <circle cx="57" cy="41" r="2.8" fill="#1C1917" />
          {/* Sweet Smile */}
          <path d="M43 53 Q50 60 57 53" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}
