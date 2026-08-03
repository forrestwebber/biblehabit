export default function TermsOfService() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-gray-400">Last updated: August 2, 2026</p>
        <div className="mt-8 space-y-4 text-gray-300">
          {/* NOTE: /terms redirects here (next.config.ts), so this is the page
              everyone actually reads — the subscription terms belong here. */}
          <h2 className="text-2xl font-semibold">1. Free Trial, Then BibleHabit Plus</h2>
          <p>Every BibleHabit account includes <strong>7 days of full access</strong>, with no card required. After the trial, reading the day&apos;s Scripture remains free and always will &mdash; the translations we serve directly are public domain and we do not put Scripture behind a paywall.</p>
          <p>The habit features built around the reading require a <strong>BibleHabit Plus</strong> subscription: marking days complete, streaks, the pacing engine and recalculation, creating or changing a reading plan, the Progress screen, additional daily readings, reminders, notes and saved highlights.</p>
          <p>Plus costs <strong>$2.99 per month</strong> or <strong>$19.99 per year</strong> (introductory price; regular price $24.99 per year). Subscriptions renew automatically at the end of each billing period until cancelled, and you can cancel at any time from the billing portal linked in Settings. Cancelling stops future charges; access continues through the period you have already paid for. Prices are in U.S. dollars and may change with notice before a renewal.</p>
          <p>Only one free trial is available per account. If you subscribe while your trial is still running, the remaining trial days carry over and billing starts when they end.</p>
          <p>Your reading history, notes and highlights belong to you and remain in your account whether or not you subscribe. Subscriptions purchased on the web are tied to your account and apply wherever you sign in.</p>
          <h2 className="text-2xl font-semibold mt-6">2. Terms</h2>
          <p>By accessing the website at https://biblehabit.co, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p>
          <h2 className="text-2xl font-semibold mt-6">3. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on BibleHabit's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose, or for any public display (commercial or non-commercial); attempt to decompile or reverse engineer any software contained on BibleHabit's website; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server. This license shall automatically terminate if you violate any of these restrictions and may be terminated by BibleHabit at any time.</p>
          <h2 className="text-2xl font-semibold mt-6">4. Disclaimer</h2>
          <p>The materials on BibleHabit's website are provided on an 'as is' basis. BibleHabit makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          <h2 className="text-2xl font-semibold mt-6">5. Limitations</h2>
          <p>In no event shall BibleHabit or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BibleHabit's website, even if BibleHabit or a BibleHabit authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          <h2 className="text-2xl font-semibold mt-6">6. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with the laws of Texas and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
        </div>
      </div>
    </div>
  );
}
