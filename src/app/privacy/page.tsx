export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: April 2026</p>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">What We Collect</h2>
          <p>BibleHabit collects your email address and reading progress data when you create an account. We use Google OAuth for authentication. We do not sell your data.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Use It</h2>
          <p>Your data is used solely to power your reading plan, track streaks, and sync progress across devices. We may send you occasional product updates if you opt in.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Data Storage</h2>
          <p>Data is stored securely using Supabase (PostgreSQL). Reading progress stored locally uses your browser&apos;s localStorage and is never shared.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact</h2>
          <p>Questions? Email <a href="mailto:hello@biblehabit.co" className="text-violet-600">hello@biblehabit.co</a></p>
        </section>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-200">
        <a href="/" className="text-violet-600 hover:text-violet-800">&larr; Back to BibleHabit</a>
      </div>
    </div>
  );
}
