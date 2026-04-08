import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-slate-50">
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        &ldquo;I will instruct you and teach you in the way you should go.&rdquo; &mdash; Psalm 32:8
      </p>
      <Link href="/" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition">
        Back to Home
      </Link>
    </div>
  );
}
