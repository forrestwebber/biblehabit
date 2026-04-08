export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-8">Last updated: April 2026</p>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Free Service</h2>
          <p>BibleHabit is provided free of charge. We reserve the right to introduce optional paid features (such as an iOS app) in the future, but core reading plan functionality will remain free forever.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">No Warranty</h2>
          <p>BibleHabit is provided &quot;as is&quot; without warranty of any kind. We do not guarantee uninterrupted access or that the service will be error-free. Use at your own discretion.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Content</h2>
          <p>Any notes, highlights, or personal data you create in BibleHabit belong to you. We do not claim ownership over user-generated content. Scripture text used is in the public domain (KJV, WEB, ASV) or linked externally via licensed sources.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Acceptable Use</h2>
          <p>BibleHabit is a Bible reading application intended for personal spiritual growth. You agree not to use this service for any unlawful purpose, to attempt to gain unauthorized access to our systems, or to interfere with other users&apos; access to the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Governing Law</h2>
          <p>These terms are governed by the laws of the State of Texas, United States. Any disputes shall be resolved in Travis County, Texas.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact</h2>
          <p>Questions about these terms? Email <a href="mailto:hello@biblehabit.co" className="text-violet-600">hello@biblehabit.co</a></p>
        </section>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-200">
        <a href="/" className="text-violet-600 hover:text-violet-800">&larr; Back to BibleHabit</a>
      </div>
    </div>
  );
}
