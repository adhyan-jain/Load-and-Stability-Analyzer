export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 3L42 13.5V34.5L24 45L6 34.5V13.5Z"
        fill="#080c0f"
        stroke="#00ff88"
        strokeWidth="2"
      />
      <polyline
        points="10,26 15,26 18,18 21,32 25,22 28,28 31,24 38,24"
        fill="none"
        stroke="#00ff88"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
