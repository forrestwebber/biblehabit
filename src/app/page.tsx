"use client";
import { BookOpen, Heart, Share2, Clock, Star, ArrowRight, Calendar, TrendingUp, Smartphone, Compass, CheckCircle } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { getTodaysVerse } from '@/data/verses';

const verse = getTodaysVerse();
const todaysVerse = {
  text: verse.text,
  reference: verse.reference,
  translation: "KJV"
};

function ShareButton({ verse, ref: verseRef }: { verse: string; ref: string }) {
  const shareText = `"${verse}" — ${verseRef}\n\nRead more at biblehabit.co`;
  const shareUrl = `https://biblehabit.co`;
  
  return (
    <div className="relative group inline-block">
      <button className="flex items-center gap-2 border border-violet-200 text-slate-600 px-6 py-3 rounded-lg hover:bg-violet-100 transition">
        <Share2 className="h-5 w-5" /> Share This Verse
      </button>
      <div className="hidden group-hover:flex absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-violet-100 p-3 gap-2 z-10">
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-violet-100 transition whitespace-nowrap">Twitter/X</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-violet-100 transition whitespace-nowrap">Facebook</a>
        <a href={`sms:?body=${encodeURIComponent(shareText)}`} className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-violet-100 transition whitespace-nowrap">iMessage</a>
        <button onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(shareText) }} className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-violet-100 transition whitespace-nowrap cursor-pointer">Copy</button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Nav */}
      <NavBar />

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
          <ShareButton verse={todaysVerse.text} ref={todaysVerse.reference} />
        </div>
      </section>

      {/* Pick Up Where I Am */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Already Reading? Pick Up Where You Are.</h2>
          <p className="text-center text-slate-500 mb-10">Been reading a physical Bible for months? We will catch up to you.</p>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-violet-100 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">I&apos;m currently reading...</label>
                <div className="flex gap-2">
                  <select className="flex-1 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500">
                    <option>Genesis</option><option>Exodus</option><option>Leviticus</option><option>Numbers</option><option>Deuteronomy</option>
                    <option>Joshua</option><option>Judges</option><option>Ruth</option><option>1 Samuel</option><option>2 Samuel</option>
                    <option>1 Kings</option><option selected>2 Kings</option><option>1 Chronicles</option><option>2 Chronicles</option>
                    <option>Ezra</option><option>Nehemiah</option><option>Esther</option><option>Job</option><option>Psalms</option><option>Proverbs</option>
                    <option>Ecclesiastes</option><option>Song of Solomon</option><option>Isaiah</option><option>Jeremiah</option><option>Lamentations</option>
                    <option>Ezekiel</option><option>Daniel</option><option>Hosea</option><option>Joel</option><option>Amos</option><option>Obadiah</option>
                    <option>Jonah</option><option>Micah</option><option>Nahum</option><option>Habakkuk</option><option>Zephaniah</option><option>Haggai</option>
                    <option>Zechariah</option><option>Malachi</option><option>Matthew</option><option>Mark</option><option>Luke</option><option>John</option>
                    <option>Acts</option><option>Romans</option><option>1 Corinthians</option><option>2 Corinthians</option><option>Galatians</option>
                    <option>Ephesians</option><option>Philippians</option><option>Colossians</option><option>1 Thessalonians</option><option>2 Thessalonians</option>
                    <option>1 Timothy</option><option>2 Timothy</option><option>Titus</option><option>Philemon</option><option>Hebrews</option><option>James</option>
                    <option>1 Peter</option><option>2 Peter</option><option>1 John</option><option>2 John</option><option>3 John</option><option>Jude</option><option>Revelation</option>
                  </select>
                  <select className="w-28 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800">
                    <option>Ch. 1</option><option>Ch. 2</option><option>Ch. 3</option><option selected>Ch. 5</option><option>Ch. 10</option><option>Ch. 15</option><option>Ch. 20</option><option>Ch. 25</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">I usually read about...</label>
                <div className="grid grid-cols-4 gap-2">
                  <button className="py-3 border-2 border-violet-200 rounded-lg text-center hover:border-violet-500 transition text-sm">
                    <p className="font-bold text-slate-900">1 chapter</p>
                    <p className="text-xs text-slate-500">~5 min</p>
                  </button>
                  <button className="py-3 border-2 border-violet-500 bg-violet-50 rounded-lg text-center text-sm">
                    <p className="font-bold text-violet-700">2-3 chapters</p>
                    <p className="text-xs text-violet-500">~15 min</p>
                  </button>
                  <button className="py-3 border-2 border-violet-200 rounded-lg text-center hover:border-violet-500 transition text-sm">
                    <p className="font-bold text-slate-900">4-5 chapters</p>
                    <p className="text-xs text-slate-500">~25 min</p>
                  </button>
                  <button className="py-3 border-2 border-violet-200 rounded-lg text-center hover:border-violet-500 transition text-sm">
                    <p className="font-bold text-slate-900">6+ chapters</p>
                    <p className="text-xs text-slate-500">~30+ min</p>
                  </button>
                </div>
              </div>

              {/* Instant preview */}
              <div className="bg-violet-50 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-violet-700 uppercase tracking-wide">Your personalized plan</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Picking up from</span>
                  <span className="font-semibold text-slate-900">2 Kings, Chapter 5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Chapters remaining</span>
                  <span className="font-semibold text-slate-900">864 chapters to Revelation</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">At your pace (2-3/night)</span>
                  <span className="font-semibold text-slate-900">~345 days</span>
                </div>
                <hr className="border-violet-200" />
                <div className="flex justify-between text-sm bg-white -mx-2 px-3 py-2 rounded-lg">
                  <span className="text-violet-600 font-semibold">You&apos;ll finish by</span>
                  <span className="font-bold text-violet-700">February 2027 &#10003;</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">By this Christmas</span>
                  <span className="font-medium text-slate-700">You&apos;ll be in Acts</span>
                </div>
              </div>

              <a href="/login" className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3 rounded-lg hover:bg-violet-800 transition font-semibold">
                Pick Up Where I Am <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Reading Plan Calculator */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Build Your Custom Reading Plan</h2>
          <p className="text-center text-slate-500 mb-10">Starting fresh or picking up where you left off — we meet you where you are.</p>
          
          <div className="bg-violet-50 rounded-2xl p-8 border border-violet-100">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Where are you in the Bible?</label>
                  <div className="flex gap-2">
                    <select className="flex-1 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500">
                      <option>Genesis</option><option>Exodus</option><option>Leviticus</option><option>2 Chronicles</option><option>Psalms</option><option>Isaiah</option><option>Matthew</option><option>Romans</option><option>Revelation</option>
                    </select>
                    <select className="w-24 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800">
                      <option>Ch. 1</option><option>Ch. 5</option><option>Ch. 10</option><option>Ch. 15</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Choose your pace</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-3 px-2 border-2 border-violet-200 rounded-lg text-center hover:border-violet-500 transition text-sm">
                      <p className="font-bold text-slate-900">6 months</p>
                      <p className="text-xs text-slate-500">~6.6 ch/day</p>
                    </button>
                    <button className="py-3 px-2 border-2 border-violet-500 bg-violet-50 rounded-lg text-center text-sm">
                      <p className="font-bold text-violet-700">12 months</p>
                      <p className="text-xs text-violet-500">~3.3 ch/day</p>
                    </button>
                    <button className="py-3 px-2 border-2 border-violet-200 rounded-lg text-center hover:border-violet-500 transition text-sm">
                      <p className="font-bold text-slate-900">18 months</p>
                      <p className="text-xs text-slate-500">~2.2 ch/day</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred translation</label>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border-2 border-violet-500 bg-violet-50 rounded-lg text-sm font-semibold text-violet-700">KJV</button>
                    <button className="flex-1 py-2 border-2 border-violet-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-violet-300">WEB</button>
                    <button className="flex-1 py-2 border-2 border-violet-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-violet-300">ESV*</button>
                    <button className="flex-1 py-2 border-2 border-violet-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-violet-300">NIV*</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">*Copyrighted translations linked via Amazon</p>
                </div>
              </div>
              
              {/* Right: Preview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-violet-100">
                <h3 className="font-bold text-violet-700 text-sm uppercase tracking-wide mb-4">Your Plan Preview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Starting from</span>
                    <span className="font-semibold text-slate-900">Genesis 1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Chapters per day</span>
                    <span className="font-semibold text-slate-900">~3.3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Reading time</span>
                    <span className="font-semibold text-slate-900">~15 min/day</span>
                  </div>
                  <hr className="border-violet-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">By June 2026</span>
                    <span className="font-medium text-slate-700">Finishing Deuteronomy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">By September 2026</span>
                    <span className="font-medium text-slate-700">Through Psalms</span>
                  </div>
                  <div className="flex justify-between items-center bg-violet-50 -mx-2 px-2 py-2 rounded-lg">
                    <span className="text-violet-600 text-sm font-semibold">By March 2027</span>
                    <span className="font-bold text-violet-700">Revelation ✓ Complete!</span>
                  </div>
                </div>
                <a href="/login" className="mt-6 w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3 rounded-lg hover:bg-violet-800 transition font-semibold">
                  Start This Plan <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Daily Reading View */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Your Daily Reading</h2>
          <p className="text-center text-slate-500 mb-10">Clean. Distraction-free. Just you and the Word.</p>
          
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 max-w-2xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-violet-300 uppercase tracking-wide">Day 47 of 365</p>
                <h3 className="text-lg font-bold">Genesis 47–49</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Your streak</p>
                <p className="text-2xl font-bold text-violet-400">🔥 47</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2">
              <div className="bg-violet-600 h-2 rounded-r-full" style={{ width: '13%' }}></div>
            </div>
            {/* Reading content */}
            <div className="px-6 py-6">
              <h4 className="text-lg font-bold text-slate-900 mb-3">Genesis 47 <span className="text-sm font-normal text-slate-400">KJV</span></h4>
              <div className="text-slate-700 leading-relaxed space-y-2 text-sm">
                <p><sup className="text-violet-400 mr-1">1</sup>Then Joseph came and told Pharaoh, and said, My father and my brethren, and their flocks, and their herds, and all that they have, are come out of the land of Canaan; and, behold, they are in the land of Goshen.</p>
                <p><sup className="text-violet-400 mr-1">2</sup>And he took some of his brethren, even five men, and presented them unto Pharaoh.</p>
                <p><sup className="text-violet-400 mr-1">3</sup>And Pharaoh said unto his brethren, What is your occupation? And they said unto Pharaoh, Thy servants are shepherds, both we, and also our fathers.</p>
                <p className="text-slate-400 italic">... continue reading ...</p>
              </div>
            </div>
            {/* Actions */}
            <div className="px-6 py-4 border-t border-violet-100 flex items-center justify-between">
              <button className="text-sm text-slate-500 hover:text-violet-600 transition flex items-center gap-1">
                <Compass className="h-4 w-4" /> Related verses & commentary
              </button>
              <button className="flex items-center gap-2 bg-violet-700 text-white px-6 py-2.5 rounded-lg hover:bg-violet-800 transition font-semibold text-sm">
                <CheckCircle className="h-4 w-4" /> Mark as Done
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Progress Dashboard */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Track Your Journey</h2>
          <p className="text-center text-slate-500 mb-10">Watch your progress grow day by day.</p>
          
          <div className="bg-slate-50 rounded-2xl p-8 border border-violet-100 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                <p className="text-3xl font-bold text-violet-600">47</p>
                <p className="text-xs text-slate-500 mt-1">Day Streak</p>
              </div>
              <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                <p className="text-3xl font-bold text-violet-600">155</p>
                <p className="text-xs text-slate-500 mt-1">Chapters Read</p>
              </div>
              <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                <p className="text-3xl font-bold text-violet-600">13%</p>
                <p className="text-xs text-slate-500 mt-1">Complete</p>
              </div>
            </div>
            {/* Calendar mockup */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">March 2026</h4>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-slate-400 font-medium py-1">{d}</div>)}
                {Array.from({length: 31}, (_, i) => (
                  <div key={i} className={`py-1.5 rounded-md ${i < 29 ? 'bg-violet-600 text-white font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">29 of 31 days completed this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Calendar className="h-8 w-8 text-violet-600" />, title: "Custom Reading Plans", desc: "Start from Genesis or 2 Chronicles — wherever you are. Pick 6, 12, or 18 months. See your future." },
              { icon: <BookOpen className="h-8 w-8 text-violet-600" />, title: "Multiple Translations", desc: "Read in KJV or WEB for free. ESV, NIV, and more available via Amazon." },
              { icon: <Heart className="h-8 w-8 text-violet-600" />, title: "Streaks & Accountability", desc: "Build your streak. Missed a day? Catch up. No guilt, just grace." },
              { icon: <Compass className="h-8 w-8 text-violet-600" />, title: "Cross-References", desc: "Discover related verses and historical commentary as you read." },
              { icon: <TrendingUp className="h-8 w-8 text-violet-600" />, title: "Progress Milestones", desc: "See where you'll be by any date. Celebrate finishing each book." },
              { icon: <Smartphone className="h-8 w-8 text-violet-600" />, title: "iOS App Coming Soon", desc: "Push notifications for your daily reading. $4.99 lifetime — no subscriptions." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-white border border-violet-100 hover:border-violet-200 transition">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Your Own Copy — Amazon Affiliate */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Your Own Copy</h2>
          <p className="text-slate-500 mb-8">Hold Scripture in your hands. Our recommended editions.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "ESV Study Bible", desc: "The gold standard for study. Notes, maps, articles.", price: "$29.99", asin: "1433502410" },
              { title: "KJV Large Print", desc: "Classic translation, easy on the eyes.", price: "$14.99", asin: "0785215611" },
              { title: "NIV Life Application", desc: "Practical notes for daily living.", price: "$24.99", asin: "1496439694" },
            ].map((book) => (
              <div key={book.title} className="bg-violet-50 rounded-xl p-6 hover:shadow-md transition">
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

      {/* Stats */}
      <section className="py-16 px-6 bg-violet-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-6">
            <div><p className="text-4xl font-bold text-violet-600">1,189</p><p className="text-slate-500 mt-1 text-sm">Chapters in the Bible</p></div>
            <div><p className="text-4xl font-bold text-violet-600">~15 min</p><p className="text-slate-500 mt-1 text-sm">Average daily reading</p></div>
            <div><p className="text-4xl font-bold text-violet-600">$0</p><p className="text-slate-500 mt-1 text-sm">Cost. Forever.</p></div>
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
        <p>&copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals LLC. Scripture changes everything.</p>
      </footer>
    </div>
  );
}
