// BibleHabit built-in chat knowledge base
// Rule-based Q&A — no API key needed, instant responses, fully controllable

export interface KnowledgeEntry {
  patterns: string[];   // lowercase keywords/phrases to match
  response: string;
  followUps?: string[]; // suggested follow-up questions
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // Plan setup
  {
    patterns: ["how do i start", "get started", "create plan", "new plan", "set up"],
    response: "To create your reading plan, go to **Dashboard** and tap **Get Started**. You'll pick what to read (Entire Bible, New Testament, or a specific book) and how much time you have each day — even 1 minute counts. I'll calculate your finish date automatically!",
    followUps: ["What if I want to read just one book?", "Can I change my pace later?"]
  },
  {
    patterns: ["change pace", "adjust plan", "too fast", "too slow", "chapters per day", "slow down", "speed up"],
    response: "Go to **Dashboard → Adjust Plan** and create a new plan at your preferred pace. You can also go to **/plans** directly. Starting fresh with a new pace is totally fine — your streak and progress history stay intact.",
    followUps: ["Will I lose my streak?", "What pace do you recommend?"]
  },
  {
    patterns: ["which pace", "recommend", "how many chapters", "how long", "minutes"],
    response: "Start with **1 chapter per day** (~5 minutes). It's the habit that matters most, not the speed. Once it clicks, you can bump to 2–3. Reading the entire Bible at 1 chapter/day takes about 3.5 years — that's totally valid! At 3/day you'll finish in about a year.",
    followUps: ["How do I change my pace?", "What's the Devotional Mix?"]
  },

  // Isaiah / chapter count confusion
  {
    patterns: ["490", "wrong chapters", "too many chapters", "isaiah", "chapter count", "says 490", "shows 490"],
    response: "This happens when your plan was created before we added book-range tracking. **Fix it in 30 seconds:** go to **/plans → Pick Up Mid-Book → choose Isaiah → select chapter 20 → Save**. Your new plan will correctly show ~47 chapters remaining in Isaiah.",
    followUps: ["Will I lose my progress?", "How do I add a daily Psalm?"]
  },

  // Streak
  {
    patterns: ["streak", "lose my streak", "missed a day", "broke my streak", "reset"],
    response: "Your streak counts consecutive days you read. If you miss a day, it resets to 0 — but **your history and XP are never lost**. The Bible isn't a race; grace is the whole point. Jump back in today and start a new streak. Some of the greatest readers have had gaps.",
    followUps: ["How do I see my reading history?", "What are Scripture Points?"]
  },

  // Translations
  {
    patterns: ["translation", "kjv", "web", "asv", "bbe", "niv", "esv", "version", "which bible"],
    response: "Right now we support **KJV, WEB, ASV, and BBE** — all free and public domain. We're working on adding NIV and ESV (they require licensing). Tap the translation pills at the top of your reading to switch instantly. KJV is classic; WEB is modern and readable.",
    followUps: ["When will NIV/ESV be available?", "Which translation is best for beginners?"]
  },
  {
    patterns: ["niv", "esv", "when", "coming soon"],
    response: "NIV and ESV require licensing agreements — we're working on it! For now, **WEB (World English Bible)** is our most readable modern translation and it's free. ASV is also excellent for study.",
  },

  // Keep Going / Re-read
  {
    patterns: ["keep going", "read ahead", "read more", "tomorrow", "next chapter", "ahead"],
    response: "After completing today's reading, tap **Keep Going →** to read tomorrow's chapters early. You can also tap the 'Up Next' card to jump right in. Getting ahead is a great habit — it means a buffer for busy days!",
    followUps: ["Does reading ahead count toward tomorrow?", "What is Re-read?"]
  },
  {
    patterns: ["re-read", "go back", "previous chapter", "reread"],
    response: "After completing today's reading, tap **Re-read previous** to revisit yesterday's chapters. Great for when something really stood out and you want to sit with it longer.",
  },

  // Devotionals / sub-plans
  {
    patterns: ["psalm", "proverb", "john", "devotional", "sub plan", "daily psalm", "daily proverb", "add another"],
    response: "You can add **Daily Devotionals** alongside your main plan — like 1 Psalm per day or 1 chapter of Proverbs. Go to **/plans** to add them. A popular combo: 1 Psalm + 1 Proverb + 1 chapter of John per day. It only adds ~10 minutes!",
    followUps: ["Can I pause a devotional?", "What's the Devotional Mix?"]
  },
  {
    patterns: ["devotional mix", "combination", "combo", "beginner"],
    response: "The classic **Devotional Mix** is: 1 Psalm/day (poetic, emotional) + 1 Proverb/day (wisdom for daily life) + 1 John/day (Gospel, Jesus's life). Together they take about 10–15 minutes. Go to **/plans** to add each one.",
  },
  {
    patterns: ["pause", "pause devotional", "pause plan", "take a break"],
    response: "On the **Today** page, each devotional has a **Pause** button. It saves your place so you can resume later. Your main reading plan can be restarted from **/plans** — your history is always preserved.",
  },

  // Verse sharing / highlights
  {
    patterns: ["share verse", "copy verse", "save verse", "highlight", "favorite verse", "bookmark"],
    response: "While reading, **tap any verse** to highlight it in yellow. Tap multiple verses to build a selection. A bar appears at the bottom with **Copy**, **Share**, and **Save** options. Saved highlights appear on your **/profile** page.",
    followUps: ["Where do I see my saved verses?", "Can I share with friends?"]
  },
  {
    patterns: ["my highlights", "saved verses", "see my highlights", "where are my"],
    response: "Go to your **/profile** page — there's a **Saved Highlights** section showing all your saved verses, with the reference and date saved. You can remove any highlight there too.",
  },

  // XP / Levels
  {
    patterns: ["xp", "scripture points", "level", "seeker", "disciple", "scholar", "elder", "prophet", "points"],
    response: "You earn **Scripture Points (XP)** for every chapter you read — 10 XP per chapter in your main plan, 5 XP for devotionals. There are 6 levels: Seeker → Student → Disciple → Scholar → Elder → Prophet. Your level shows on your Profile page.",
    followUps: ["How do I level up?", "Where do I see my XP?"]
  },

  // Progress / stats
  {
    patterns: ["progress", "how many", "percent", "complete", "stats", "how far"],
    response: "Check your **Dashboard** for the circular progress ring showing your % complete, chapters read, current book, and projected finish date. Your **Profile** page has the full calendar view, books completed, and saved highlights.",
  },
  {
    patterns: ["finish", "when will i finish", "finish date", "how long"],
    response: "Your projected finish date is on the Dashboard — it updates as you read. If you're behind, it adjusts forward; if you're ahead, it moves earlier. You can also change your daily pace on the Plans page to hit a specific target date.",
  },

  // Login / sync
  {
    patterns: ["login", "sign in", "account", "sync", "lost progress", "different device", "save progress"],
    response: "Sign in with Google or email at **/login** to sync your progress across all your devices. Once signed in, your streak, progress, and history sync automatically. If you read on your phone without signing in, the data is saved locally — sign in and it'll merge.",
  },
  {
    patterns: ["google", "sign in with google", "google login"],
    response: "Tap **Sign in with Google** on the login page — it takes about 5 seconds. Your progress syncs to the cloud and works on any device. No password needed.",
  },

  // Profile picture
  {
    patterns: ["profile picture", "profile photo", "avatar", "upload photo", "change picture"],
    response: "Profile picture upload is coming soon! Right now your account uses the photo from your Google account if you signed in with Google. We're adding a custom upload feature in the next update.",
  },

  // Calendar
  {
    patterns: ["calendar", "see my days", "which days", "reading history", "past readings"],
    response: "Go to your **Profile** page — there's a full calendar showing every day you read (highlighted in purple). Use the arrow buttons to navigate between months. You can see your entire reading history at a glance.",
  },

  // iOS app
  {
    patterns: ["app", "ios", "iphone", "apple", "download", "app store"],
    response: "The BibleHabit iOS app is coming soon! We're in the Apple App Store submission process now. For the best mobile experience in the meantime, visit **biblehabit.co** in Safari and tap **Share → Add to Home Screen** — it works like a native app!",
  },

  // General encouragement
  {
    patterns: ["hard", "difficult", "struggling", "behind", "gave up", "motivation", "why bother"],
    response: "The fact that you're here means you care. Scripture doesn't require perfection — it meets you where you are. Even one verse a day matters. If you're behind, don't try to catch up all at once. Just read today's portion and let tomorrow take care of itself. You're not behind on grace.",
    followUps: ["How do I slow down my pace?", "What's a good starting point?"]
  },
  {
    patterns: ["encourage", "good job", "i read", "i did it", "finished"],
    response: "That's amazing — every day you read is a day well spent. Keep going! Your consistency is building something that will last far longer than any single reading session. Check your streak on the Dashboard — you've earned it.",
  },

  // Feedback / bugs
  {
    patterns: ["bug", "broken", "not working", "error", "issue", "problem", "glitch"],
    response: "Sorry about that! Please describe what happened and I'll pass it to the team. You can also email **hello@biblehabit.co** directly. We take every bug report seriously — your feedback makes the app better for everyone.",
  },
  {
    patterns: ["feature", "idea", "suggestion", "wish", "would be nice", "can you add"],
    response: "Love it — what's the idea? Feature requests go directly to the team and shape what we build next. Some of our best features came from users just like you.",
  },
];

// Greeting responses
const GREETINGS = [
  "Hi! I'm here to help with BibleHabit — reading plans, features, or Bible questions. What's on your mind?",
  "Hey! Ask me anything about your reading plan, features, or how to get the most out of BibleHabit.",
];

// Default fallback
const FALLBACK_RESPONSES = [
  "That's a great question. For the most up-to-date help, email **hello@biblehabit.co** — the team responds quickly. Is there anything else I can help with?",
  "I don't have a perfect answer for that yet, but the team at **hello@biblehabit.co** would love to help. Want to ask me something else?",
  "I'm still learning! For that one, try emailing **hello@biblehabit.co**. In the meantime, can I help with anything else about your reading plan?",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function getGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function getResponse(userMessage: string): { response: string; followUps?: string[] } {
  const normalized = normalize(userMessage);

  // Score each entry
  let bestScore = 0;
  let bestEntry: KnowledgeEntry | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const pattern of entry.patterns) {
      if (normalized.includes(pattern)) {
        // Longer pattern match = higher confidence
        score += pattern.split(" ").length * 2;
      }
      // Partial word match
      const words = pattern.split(" ");
      for (const word of words) {
        if (word.length > 3 && normalized.includes(word)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Minimum confidence threshold
  if (bestScore >= 2 && bestEntry) {
    return { response: bestEntry.response, followUps: bestEntry.followUps };
  }

  // Fallback
  return {
    response: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
  };
}
