import { BookOpen, Clock, Heart, Calendar, Compass, Smartphone, Star } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <a href="/" className="text-2xl font-bold text-slate-900">BibleHabit</a>
        <a href="/login" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition">Create Account</a>
      </nav>

      <section className="text-center py-20 px-6 max-w-3xl mx-auto">
        <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-3 py-1 rounded-full">100% Free Forever</span>
        <h1 className="text-4xl font-bold text-slate-900 mt-6 mb-4">No Plans. No Pricing. Just Scripture.</h1>
        <p className="text-lg text-slate-500 mb-8">
          BibleHabit is completely free. No subscriptions, no paywalls, no hidden costs. 
          Create an account and get everything — forever.
        </p>
      </section>

      <section className="py-12 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">What You Get (All Free)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: <Calendar className="h-6 w-6 text-violet-600" />, title: "Custom Reading Plans", desc: "6 months, 12 months, 18 months, or your own pace. Start from Genesis or pick up where you are." },
            { icon: <BookOpen className="h-6 w-6 text-violet-600" />, title: "Daily Reading", desc: "Clean KJV text ready each morning. Read it. Mark it done. Move on." },
            { icon: <Heart className="h-6 w-6 text-violet-600" />, title: "Streaks & Progress", desc: "Track your daily streak and see how far you have come. Calendar view of your journey." },
            { icon: <Clock className="h-6 w-6 text-violet-600" />, title: "See Your Future", desc: "Know exactly where you will be by any date. Your pace, your timeline." },
            { icon: <Compass className="h-6 w-6 text-violet-600" />, title: "Related Verses & Commentary", desc: "Cross-references and historical context. Go deeper without leaving the page." },
            { icon: <Smartphone className="h-6 w-6 text-violet-600" />, title: "iOS App (Coming Soon)", desc: "Take your plan anywhere. Push notifications. $4.99 lifetime — no subscriptions." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 p-5 bg-white rounded-xl border border-violet-100">
              <div className="mt-1">{f.icon}</div>
              <div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 text-center">
        <a href="/login" className="inline-flex items-center gap-2 bg-violet-700 text-white px-8 py-3 rounded-lg hover:bg-violet-800 transition font-semibold text-lg">
          <Star className="h-5 w-5" /> Create Your Free Account
        </a>
      </section>

      <footer className="bg-white border-t border-violet-100 py-8 px-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} BibleHabit. Scripture changes everything.</p>
      </footer>
    </div>
  );
}
