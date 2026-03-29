import { BookOpen, Heart, Share2, Clock, Star, ArrowRight } from 'lucide-react';

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
          <a href="/plans" className="text-sm text-slate-500 hover:text-slate-800">Reading Plans</a>
          <a href="/plans" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition">Browse Plans</a>
        </div>
      </nav>

      {/* Hero — Today's Verse */}
      <section id="verse" className="text-center py-20 px-6 max-w-3xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-violet-600 font-semibold mb-6">Today&apos;s Verse</p>
        <blockquote className="text-3xl md:text-4xl font-serif leading-relaxed text-slate-900 mb-6">
          &ldquo;{todaysVerse.text}&rdquo;
        </blockquote>
        <p className="text-lg text-slate-500 mb-8">— {todaysVerse.reference} ({todaysVerse.translation})</p>
        <div className="flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-lg hover:bg-violet-800 transition font-semibold">
            <BookOpen className="h-5 w-5" /> Start Reading
          </button>
          <button className="flex items-center gap-2 border border-violet-200 text-slate-600 px-6 py-3 rounded-lg hover:bg-violet-50 transition">
            <Share2 className="h-5 w-5" /> Share
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: <BookOpen className="h-8 w-8 text-violet-600" />, title: "Daily Verse", desc: "A fresh verse every day to center your morning. Public domain translations — no licensing, just Scripture." },
            { icon: <Clock className="h-8 w-8 text-violet-600" />, title: "Reading Plans", desc: "Bible in a Year, Psalms 30-Day, Gospels Deep Dive. Pick a plan, track your progress, build the habit." },
            { icon: <Heart className="h-8 w-8 text-violet-600" />, title: "Streaks & Progress", desc: "Track your daily reading streak. Missed a day? Catch up. See how far you have come." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6">
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Get Your Own Copy — Amazon Affiliate */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Your Own Copy</h2>
          <p className="text-slate-500 mb-8">Hold Scripture in your hands. These are our recommended editions.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "ESV Study Bible", desc: "The gold standard for study. Notes, maps, articles.", price: "$29.99" },
              { title: "KJV Large Print", desc: "Classic translation, easy on the eyes.", price: "$14.99" },
              { title: "NIV Life Application", desc: "Practical notes for daily living.", price: "$24.99" },
            ].map((book) => (
              <div key={book.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <h3 className="font-bold text-slate-900 mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{book.desc}</p>
                <p className="text-violet-600 font-bold mb-3">{book.price}</p>
                <a href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title)}&tag=wandereadvisor-20`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 font-semibold">
                  View on Amazon <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Build the Habit. One Verse at a Time.</h2>
        <p className="text-slate-500 mb-8 max-w-xl mx-auto">Join thousands building a daily Scripture habit. Always free. Always will be.</p>
        <a href="#verse" className="inline-flex items-center gap-2 bg-violet-700 text-white px-8 py-3 rounded-lg hover:bg-violet-800 transition font-semibold text-lg">
          <Star className="h-5 w-5" /> Start Reading Today
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-violet-100 py-8 px-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} BibleHabit. Scripture changes everything.</p>
      </footer>
    </div>
  );
}
