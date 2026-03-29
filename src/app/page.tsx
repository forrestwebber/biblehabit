import { BookOpen, Heart, Share2, Clock, Star, ArrowRight, Calendar, TrendingUp, Smartphone, MessageCircle, Compass } from 'lucide-react';

const todaysVerse = {
  text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  reference: "John 3:16",
  translation: "KJV"
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <a href="/" className="text-2xl font-bold text-slate-900">BibleHabit</a>
        <div className="flex items-center gap-4">
          <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-3 py-1 rounded-full">100% Free Forever</span>
          <a href="/login" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition">Create Account</a>
        </div>
      </nav>

      {/* Hero — Today's Verse */}
      <section id="verse" className="text-center py-20 px-6 max-w-3xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-violet-600 font-semibold mb-6">Today&apos;s Verse</p>
        <blockquote className="text-3xl md:text-4xl font-serif leading-relaxed text-slate-900 mb-6">
          &ldquo;{todaysVerse.text}&rdquo;
        </blockquote>
        <p className="text-lg text-slate-500 mb-8">&mdash; {todaysVerse.reference} ({todaysVerse.translation})</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/login" className="flex items-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-lg hover:bg-violet-800 transition font-semibold">
            <BookOpen className="h-5 w-5" /> Start Your Reading Plan
          </a>
          <button className="flex items-center gap-2 border border-violet-200 text-slate-600 px-6 py-3 rounded-lg hover:bg-violet-100 transition">
            <Share2 className="h-5 w-5" /> Share This Verse
          </button>
        </div>
      </section>

      {/* What You Get — Feature Showcase */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Everything You Need to Build a Daily Bible Habit</h2>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">Free forever. No subscriptions. No paywalls. Just you and Scripture.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Calendar className="h-8 w-8 text-violet-600" />, title: "Custom Reading Plans", desc: "Read the Bible in 6 months, 12 months, or 18 months. Already started? Pick up right where you are — tell us you're in 2 Chronicles and we'll build your plan from there." },
              { icon: <TrendingUp className="h-8 w-8 text-violet-600" />, title: "See Your Future", desc: "\"By November 2026, you'll be finishing Revelation.\" See exactly where you'll be at any date. Your pace, your timeline, your journey mapped out." },
              { icon: <BookOpen className="h-8 w-8 text-violet-600" />, title: "Daily Reading", desc: "Each day, your assigned chapters are ready. Read them right here with clean, distraction-free KJV text. Mark as done. Move to tomorrow." },
              { icon: <Heart className="h-8 w-8 text-violet-600" />, title: "Streaks & Progress", desc: "Watch your streak grow. 7 days. 30 days. 365 days. Missed a day? Catch up at your own pace — no guilt, just grace." },
              { icon: <Compass className="h-8 w-8 text-violet-600" />, title: "Related Verses & Commentary", desc: "Discover cross-references and historical context for what you're reading. Go deeper without leaving the page." },
              { icon: <Smartphone className="h-8 w-8 text-violet-600" />, title: "iOS App Coming Soon", desc: "Take your reading plan anywhere. Push notifications for your daily reading. $4.99 lifetime access — no subscriptions ever." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-violet-100 hover:border-violet-200 transition">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Reading Plan Preview */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="text-4xl font-bold text-violet-600 mb-4">1</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tell Us Where You Are</h3>
              <p className="text-slate-500">Starting fresh? Pick &ldquo;Genesis 1.&rdquo; Already reading? Select your current book and chapter.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="text-4xl font-bold text-violet-600 mb-4">2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Choose Your Pace</h3>
              <p className="text-slate-500">6 months (bold), 12 months (steady), 18 months (relaxed), or set your own. We show you exactly how many chapters per day.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="text-4xl font-bold text-violet-600 mb-4">3</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Read & Track Daily</h3>
              <p className="text-slate-500">Your daily reading appears each morning. Read it. Mark it done. Watch your progress grow. It&apos;s that simple.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Real People</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-6">
              <p className="text-4xl font-bold text-violet-600">1,189</p>
              <p className="text-slate-500 mt-1">Chapters in the Bible</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-violet-600">~3.3</p>
              <p className="text-slate-500 mt-1">Chapters/day for 1 year</p>
            </div>
            <div className="p-6">
              <p className="text-4xl font-bold text-violet-600">15 min</p>
              <p className="text-slate-500 mt-1">Average daily reading time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Your Own Copy — Amazon Affiliate */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Your Own Copy</h2>
          <p className="text-slate-500 mb-8">Hold Scripture in your hands. These are our recommended editions.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "ESV Study Bible", desc: "The gold standard for study. Notes, maps, articles.", price: "$29.99", asin: "1433502410" },
              { title: "KJV Large Print", desc: "Classic translation, easy on the eyes.", price: "$14.99", asin: "0785215611" },
              { title: "NIV Life Application", desc: "Practical notes for daily living.", price: "$24.99", asin: "1496439694" },
            ].map((book) => (
              <div key={book.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-slate-900 mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{book.desc}</p>
                <p className="text-violet-600 font-bold mb-3">{book.price}</p>
                <a href={`https://www.amazon.com/dp/${book.asin}?tag=wandereadvisor-20`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 font-semibold">
                  View on Amazon <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your Bible Habit Today</h2>
        <p className="text-slate-500 mb-8 max-w-xl mx-auto">Free forever. No credit card. No catch. Just Scripture, one day at a time.</p>
        <a href="/login" className="inline-flex items-center gap-2 bg-violet-700 text-white px-8 py-3 rounded-lg hover:bg-violet-800 transition font-semibold text-lg">
          <Star className="h-5 w-5" /> Create Your Free Account
        </a>
        <p className="text-xs text-slate-400 mt-4">iOS app coming soon &mdash; $4.99 lifetime access</p>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-violet-100 py-8 px-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} BibleHabit. Scripture changes everything.</p>
      </footer>
    </div>
  );
}
