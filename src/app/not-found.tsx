import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F7F2E8" }}>
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "'Lora', serif", color: "#221C14" }}>Page Not Found</h1>
      <p className="mb-8 max-w-sm" style={{ color: "#5C5142" }}>
        &ldquo;I will instruct you and teach you in the way you should go.&rdquo; &mdash; Psalm 32:8
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl font-semibold transition"
        style={{ background: "#221C14", color: "#F7F2E8" }}
      >
        Back to Home
      </Link>
    </div>
  );
}
