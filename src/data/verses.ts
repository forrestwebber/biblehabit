export interface DailyVerse {
  text: string;
  reference: string;
  topic: string;
}

/**
 * 30 daily verses — KJV text, mixed Old Testament and New Testament.
 * The homepage rotates through these based on the day of the year.
 */
export const dailyVerses: DailyVerse[] = [
  // ── Old Testament ─────────────────────────────────────────────
  {
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    reference: "Proverbs 3:5-6",
    topic: "trust",
  },
  {
    text: "The LORD is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
    topic: "provision",
  },
  {
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    reference: "Isaiah 41:10",
    topic: "courage",
  },
  {
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    reference: "Jeremiah 29:11",
    topic: "hope",
  },
  {
    text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9",
    topic: "courage",
  },
  {
    text: "The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee.",
    reference: "Numbers 6:24-25",
    topic: "blessing",
  },
  {
    text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    reference: "Isaiah 40:31",
    topic: "patience",
  },
  {
    text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.",
    reference: "Psalm 37:4",
    topic: "joy",
  },
  {
    text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
    reference: "Psalm 27:1",
    topic: "faith",
  },
  {
    text: "He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.",
    reference: "Ecclesiastes 3:11",
    topic: "purpose",
  },
  {
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
    reference: "Proverbs 16:3",
    topic: "work",
  },
  {
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9",
    topic: "strength",
  },
  {
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    reference: "Psalm 34:18",
    topic: "comfort",
  },
  {
    text: "Create in me a clean heart, O God; and renew a right spirit within me.",
    reference: "Psalm 51:10",
    topic: "renewal",
  },
  {
    text: "As for God, his way is perfect: the word of the LORD is tried: he is a buckler to all those that trust in him.",
    reference: "Psalm 18:30",
    topic: "trust",
  },
  // ── New Testament ─────────────────────────────────────────────
  {
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    reference: "John 3:16",
    topic: "salvation",
  },
  {
    text: "I can do all things through Christ which strengtheneth me.",
    reference: "Philippians 4:13",
    topic: "strength",
  },
  {
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    reference: "Romans 8:28",
    topic: "purpose",
  },
  {
    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    reference: "Matthew 6:33",
    topic: "priorities",
  },
  {
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    reference: "Matthew 11:28",
    topic: "rest",
  },
  {
    text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
    reference: "Romans 12:2",
    topic: "transformation",
  },
  {
    text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
    reference: "John 14:27",
    topic: "peace",
  },
  {
    text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance: against such there is no law.",
    reference: "Galatians 5:22-23",
    topic: "character",
  },
  {
    text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    reference: "Ephesians 2:8-9",
    topic: "grace",
  },
  {
    text: "Jesus said unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    reference: "John 14:6",
    topic: "truth",
  },
  {
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
    reference: "Philippians 4:6-7",
    topic: "prayer",
  },
  {
    text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
    reference: "1 John 1:9",
    topic: "forgiveness",
  },
  {
    text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
    reference: "2 Corinthians 5:17",
    topic: "renewal",
  },
  {
    text: "The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance.",
    reference: "2 Peter 3:9",
    topic: "patience",
  },
  {
    text: "Casting all your care upon him; for he careth for you.",
    reference: "1 Peter 5:7",
    topic: "trust",
  },
];

/**
 * Returns today's verse based on the day of the year.
 * Cycles through all 30 verses, then repeats.
 */
export function getTodaysVerse(): DailyVerse {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyVerses[dayOfYear % dailyVerses.length];
}
